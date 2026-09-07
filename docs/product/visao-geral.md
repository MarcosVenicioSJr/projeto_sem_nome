## Projeto: App de Clubes de Livro

Documento de especificação inicial — última atualização: 04/09/2026

## Visão Geral

Aplicativo mobile (Android e iOS) que funciona em dois eixos:

- Perfil de leitor individual — gratuito, para qualquer pessoa.

- Clubes de livro — grupos fechados por convite, com custo mensal.

## 1. Perfil de Leitor

- Cadastro gratuito.

- Dados pessoais: nome, idade, etc.

- Histórico de livros já lidos.

- Preferência de gêneros literários.

- Lista de clubes que participa.

- Recomendações de livros: baseadas no gênero preferido do usuário, via integração com programas de afiliados (fonte de monetização).

## 2. Clubes de Livro

## Estrutura e Acesso

- Cada clube tem 1 fundador + 1 co-fundador.

- Acesso fechado, só por convite — não existe busca pública nem solicitação de entrada.

- Apenas fundador e co-fundador podem enviar convites.

- A dinâmica de leitura (ritmo, se todos leem o mesmo livro ou não) é decidida livremente por cada clube — o app não interfere.


## Funcionalidades

- Chat entre membros.

- Marcação de encontros (data, local ou link).

- Enquetes para escolher o próximo livro.

- Competições internas (dentro do próprio clube):

- Métricas possíveis: mais livros lidos, mais páginas, mais tempo de leitura, etc.

- Registro de progresso é manual (o próprio usuário informa).

- Apenas por diversão, sem prêmio.

## Monetização do Clube

- Taxa de R\$ 20,00/mês por clube.

- Cobrança vinculada ao clube (não a uma pessoa específica) — não importa quem paga.

- Se não pagar: clube fica bloqueado (sem acesso) até regularizar. Dados não são excluídos.

## 3. Guerra de Clubes

Competição entre clubes diferentes (clube vs. clube).

- O app oferece um conjunto fixo de regras de guerra pré-definidas.

- Cada clube escolhe qual regra de guerra quer seguir (a duração da guerra já vem embutida na regra escolhida).

- Matchmaking automático: dois clubes com a mesma regra escolhida são pareados quando ambos estão disponíveis.

- Para equilibrar clubes de tamanhos diferentes: existe um teto de pontuação por pessoa (em vez de faixas de tamanho de clube).

- Por enquanto, é apenas por diversão, sem prêmio.

## 4. Tecnologia

- Stack definida: React Native + TypeScript.


## 5. Pontos em Aberto

| Tópico | Status |
| --- | --- |
| Cadastro de livros (manual vs. integração com base de dados tipo Google Books, para trazer capa/sinopse/nº de páginas automaticamente) | A definir |
| Fluxo de pagamento da taxa de clube (gateway: Stripe, Mercado Pago, etc.; como o co-fundador visualiza a cobrança) | A definir |
| Nome do app | A definir |
| Jornada do usuário / telas principais | A definir posteriormente |
| Conjunto de regras fixas da Guerra de Clubes (quais métricas, durações específicas) | A detalhar |

## Próximos Passos Sugeridos

- 1. Definir o conjunto fixo de regras da Guerra de Clubes.

- 2. Decidir o fluxo de pagamento e o gateway.

- 3. Desenhar a jornada do usuário (fluxo de telas).

- 4. Definir se o cadastro de livros será manual ou via integração.

- 5. Brainstorm de nome para o app.
