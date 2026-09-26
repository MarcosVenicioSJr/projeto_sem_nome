# Sistema de Gestão de Barbearia — Descrição dos Módulos

Documento de referência funcional para início da implementação do back-end.

## Agenda

**Entidades:** Barbeiro, Serviço, BarbeiroServico (associação com preço e duração próprios por barbeiro), Agendamento (nome/telefone do cliente, barbeiro, serviço(s), data/hora início e fim, status).

**Regras de negócio:**

- Agenda organizada por barbeiro; cada barbeiro escolhe quais serviços realiza e define preço/duração próprios para cada um (a duração não é fixa por serviço).
- Cliente final não tem cadastro/login — só informa nome e telefone no momento do agendamento.
- Confirmação automática, sem aprovação manual.
- Cancelamento feito pelo cliente via link (WhatsApp/SMS), liberado até 2h antes do horário.
- Antecedência mínima para marcar: 1 hora.
- Limite por telefone: até 2 agendamentos no mesmo dia, desde que sequenciais (um começa onde o outro termina) e com o mesmo barbeiro. Libera de novo no dia seguinte.
- Slots disponíveis calculados combinando: jornada de trabalho do barbeiro no dia → menos bloqueios/folgas → menos agendamentos já existentes.
- No-show não tem tratamento automático — precisa ser cancelado manualmente pelo balcão (ver Financeiro).

**Decisões (antes pendentes):**

- Tentativa de marcar um 3º horário no mesmo dia: bloqueada sempre.
- Reagendamento não é ação própria: é cancelar + marcar de novo.

## Financeiro

Sem gateway de pagamento — é um registro manual do que já aconteceu.

- **Receitas:** cada atendimento concluído gera um registro; barbeiro/balcão informa valor recebido e forma de pagamento (dinheiro, PIX, débito, crédito) — só informativo, sem processamento real.
- **Comissão do barbeiro:** calculada em fechamento diário (não em tempo real), com percentual configurado por barbeiro. Base: todos os serviços do dia que não foram cancelados. Incide só sobre serviços. O sistema apenas mostra o valor a receber — não controla se já foi pago.
- **Despesas:** cadastro manual — descrição, categoria, valor, data, recorrente ou não.
- Fora de escopo nesta fase: fechamento de caixa consolidado detalhado.

## Serviços

- Cadastro geral do serviço: só nome (sem categoria).
- Cada barbeiro escolhe quais serviços realiza (não é automático que todos façam todos os serviços).
- Para cada serviço escolhido, o barbeiro define preço e duração próprios, via BarbeiroServico.

## Produtos

Produtos vendáveis voltaram ao escopo (item "Produtos" do menu do portal admin). Cadastro com nome, categoria, preço, custo e controle de quantidade próprio, independente do módulo Estoque.

## Estoque

Voltado para ferramentas/insumos internos usados pelos barbeiros (lâmina, álcool, gel) — não é estoque de produtos para venda.

- Tipo: apenas consumíveis.
- Cadastro de itens: nome, quantidade atual, unidade de medida.
- Controle manual e independente — sem vínculo automático entre consumo de item e atendimento.
- Alerta de estoque baixo (quantidade mínima configurável por item).

## Relatórios

Granularidade mensal, sem filtro de período customizável:

- Faturamento por mês (soma das receitas de atendimentos concluídos).
- Quantidade de clientes por mês (telefones distintos com atendimento concluído; cancelados não contam).

## Site do estabelecimento

Página pública por tenant (subdomínio/slug) com serviços, fotos e botão de agendamento. Marcado como fora de escopo funcional por enquanto — será desenhado na etapa de UI/design, sem regras de negócio detalhadas ainda.

## Multi-tenant (transversal a todos os módulos)

- `tenant_id` em toda tabela; toda query filtra pelo tenant do token para isolar dados entre barbearias.
- Onboarding self-service da barbearia com criação automática de subdomínio/slug.
- Multi-usuário por tenant: dono, gerente, barbeiro, com permissões diferentes (gerente com as mesmas permissões do dono por enquanto).

## Módulos ainda sem regras de negócio detalhadas

Existem hoje apenas como itens do menu do portal admin, sem modelagem funcional:

- Dashboard
- Clientes
- Equipe (comissões/horários)
- Configurações
