# **Conformidade com a LGPD — App de Clubes de Livro** 

_Documento de análise — última atualização: 05/09/2026_ 

## **1. Visão Geral** 

Este documento lista os pontos de atenção em relação à Lei Geral de Proteção de Dados (Lei 13.709/2018) para o aplicativo de clubes de livro, considerando as funcionalidades já definidas: perfil de leitor gratuito, clubes fechados por convite com cobrança recorrente, chat, enquetes, competições internas, Guerra de Clubes e recomendações via afiliados. 

## **2. Mapeamento de Dados Pessoais Tratados** 

|**Dado**|**Categoria**|**Finalidade**|**Base legal**|
|---|---|---|---|
|Nome, email, senha (hash)|Cadastral|Autenticação e identificação|Execução de contrato|
|Idade / data de nascimento|Cadastral|Verificação de idade mínima|Execução de contrato|
|Histórico de livros lidos|Comportamental|Funcionamento do app (perfil,<br>competições)|Execução de contrato|
|Gêneros literários preferidos|Comportamental|Perfil e recomendações|Execução de contrato (perfil) /<br>Consentimento (recomendação)|
|Clubes que participa, papel<br>(fundador/co-fundador/membro)|Cadastral|Estrutura de acesso e permissões|Execução de contrato|
|Mensagens de chat|Comunicação|Funcionalidade de chat do clube|Execução de contrato|
|Dados de pagamento (token/referência,<br>não o cartão em si)|Financeiro|Cobrança mensal do clube|Execução de contrato + obrigação legal|
|Progresso de leitura (autoinformado)|Comportamental|Competições internas e Guerra de<br>Clubes|Execução de contrato|
|Convites enviados (email do convidado)|Cadastral|Sistema de convite fechado|Execução de contrato / Legítimo<br>interesse|
|Dados de recomendação via afiliados<br>(perfil de comportamento de leitura)|Comportamental|Geração de recomendações<br>personalizadas|**Consentimento explícito e opcional**|
|Notificações de marketing/novidades|Contato|Comunicação institucional|**Consentimento explícito e opcional**|



**Observação:** nenhum dos dados listados se enquadra como “dado sensível” pela definição da LGPD (art. 5º, II — origem racial/étnica, convicção religiosa, opinião política, saúde, vida sexual, dado genético/biométrico). Ainda assim, todos são dados pessoais comuns e estão sujeitos à lei. 

## **3. Base Legal e Consentimento** 

- Dados essenciais ao funcionamento do app (cadastro, histórico, clube, pagamento, chat) se apoiam em **execução de contrato** — não exigem checkbox de consentimento separado, mas precisam estar claros na Política de Privacidade. 

- Finalidades **secundárias** — recomendação personalizada via afiliados e notificações de marketing — exigem **consentimento explícito, granular e opt-in** (nunca pré-marcado, nunca embutido no aceite geral dos Termos). 

- O uso do app (perfil, clubes, chat) **não pode ser condicionado** à aceitação dessas finalidades secundárias — recusar recomendações personalizadas não pode bloquear ou limitar o uso do restante do app. 

- Guardar no banco: timestamp do aceite, versão dos Termos/Política vigente no momento, e cada consentimento granular concedido — isso é a prova de conformidade em caso de fiscalização. 

- Idade mínima recomendada: **18 anos** , para evitar a complexidade do consentimento parental exigido pelo art. 14 (agravado pelo fato de haver cobrança recorrente envolvida). 

## **4. Direitos do Titular dos Dados (Arts. 17–22)** 

O app precisa oferecer, na prática (não só na política escrita), meios para o usuário: 

- **Acessar** os próprios dados (o que foi coletado, com quem foi compartilhado) 

- **Corrigir** dados incompletos ou desatualizados 

- **Excluir a conta** — fluxo real que apague ou anonimize os dados no banco, não apenas desative o login 

- **Portabilidade** — exportar os próprios dados (histórico de leitura, perfil) em formato legível 

- **Revogar consentimentos** não essenciais a qualquer momento (recomendações, marketing), separadamente da exclusão total da conta 

- **Revisar decisões automatizadas** (art. 20) — como as recomendações de livros são geradas por um perfil comportamental, o usuário tem direito a solicitar revisão/explicação de como aquela recomendação foi gerada 

**Ponto de atenção específico do app:** o que acontece com as mensagens de chat e dados de um usuário quando ele sai ou é removido de um clube? Recomenda-se anonimizar a autoria das mensagens antigas (em vez de apagar o histórico inteiro, o que afetaria a experiência dos outros membros). 

## **5. Compartilhamento de Dados com Terceiros** 

Todo operador de dados envolvido precisa constar na Política de Privacidade, incluindo: 

**Gateway de pagamento** — não armazenar dado de cartão diretamente; usar tokenização do próprio gateway (também exigência de PCI-DSS) **API de afiliados (ex: Amazon)** — deixar claro que dados de preferência de leitura podem ser usados para gerar as recomendações **Provedor de nuvem/hospedagem** (AWS, GCP, etc.) — é operador de dados; verificar localização dos servidores **Serviço de push notification** (ex: Firebase/FCM) — processa tokens de dispositivo, também é um operador 

Qualquer ferramenta de analytics ou monitoramento de erros (ex: Sentry, Mixpanel), se adotada no futuro 

## **6. Retenção e Eliminação de Dados** 

Definir por escrito por quanto tempo cada tipo de dado é mantido: 

Dados de conta ativa: enquanto o usuário mantiver o cadastro 

- Após exclusão de conta: prazo curto para eliminação efetiva (ex: 30 dias), exceto dados que a lei exige guardar por obrigação legal (ex: dados fiscais de pagamento, retidos pelo prazo contábil/fiscal aplicável) 

Mensagens de chat de clube após saída do membro: anonimizar autoria, mas manter o conteúdo para não quebrar o histórico do clube 

Clube inadimplente e bloqueado: os dados **não são excluídos** enquanto bloqueado (já definido), mas deve haver um prazo máximo antes de considerar exclusão definitiva se o clube nunca mais for regularizado 

## **7. Incidentes de Segurança (Vazamento de Dados)** 

- A LGPD exige comunicação à ANPD e aos titulares afetados em prazo razoável em caso de incidente que possa acarretar risco relevante 

- Isso reforça pontos já definidos na parte de segurança: log de auditoria de eventos sensíveis, revogação de sessões em troca de senha, e a necessidade futura (fase 2) de um processo formal de resposta a incidentes 

Recomenda-se documentar, desde já, um plano simples: quem é avisado internamente, como o usuário é notificado, e o prazo-alvo de resposta 

## **8. Governança e Estrutura de Conformidade** 

- **Política de Privacidade e Termos de Uso** : precisam ser públicos, escritos em linguagem clara, e cobrir tudo o que está listado neste documento **Encarregado de Dados (DPO)** : a LGPD recomenda a indicação de um encarregado (pode ser uma pessoa da própria equipe no início, não precisa ser um cargo dedicado); o contato dele deve estar acessível na política 

- **Registro das Operações de Tratamento (ROPA)** : lista interna de quais dados são tratados, com qual finalidade e base legal — a tabela da seção 2 deste documento é um bom ponto de partida 

- Founder e co-fundador de cada clube lidam com dados de outros membros (convites, remoção de membros) — vale deixar claro na política que o app continua sendo o controlador principal dos dados, mesmo com essas permissões delegadas dentro do clube 

## **9. Transferência Internacional de Dados** 

- Se o provedor de nuvem ou a API de afiliados (Amazon) processar dados fora do Brasil, isso conta como transferência internacional de dados (art. 33 da LGPD) 

- Normalmente resolvido via cláusulas contratuais padrão do próprio provedor (a maioria dos grandes provedores como AWS e Google já oferece isso) — vale apenas confirmar e mencionar na política de privacidade 

## **10. Checklist Priorizado** 

**Essencial para o lançamento (MVP):** - [ ] Política de Privacidade e Termos de Uso publicados e acessíveis no app - [ ] Checkbox de aceite (não prémarcado) no cadastro - [ ] Consentimentos granulares e opcionais para recomendações e marketing - [ ] Fluxo funcional de exclusão de conta - [ ] Idade mínima de 18 anos definida nos Termos - [ ] Não armazenar dado de cartão diretamente (tokenização via gateway) - [ ] Registro de timestamp e versão do aceite/consentimento no banco 

**Fase 2 (pode vir depois do MVP):** - [ ] Indicação formal de Encarregado de Dados (DPO) - [ ] Registro formal das Operações de Tratamento (ROPA) - [ ] Fluxo de portabilidade de dados (exportação) - [ ] Plano formal de resposta a incidentes de segurança - [ ] Revisão/documentação de cláusulas de transferência internacional com fornecedores 

## **11. Resumo Executivo** 

|**Item**|**Decisão/Recomendação**|
|---|---|
|Idade mínima|18 anos|
|Dados sensíveis (art. 5º LGPD)|Não há tratamento identificado|
|Base legal principal|Execução de contrato|



|Finalidades com consentimento à parte|Recomendações via afiliados, notificações de marketing|
|---|---|
|Dado de cartão|Não armazenar — tokenização via gateway|
|Exclusão de conta|Deve haver fluxo real de eliminação/anonimização|
|Mensagens de chat após saída do clube|Anonimizar autoria, manter conteúdo|
|Clube inadimplente|Dados mantidos, acesso bloqueado|
|DPO|Recomendado, pode ser informal na fase inicial|



