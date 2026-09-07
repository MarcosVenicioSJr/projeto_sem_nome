# **Contents** 

|**Segurança — Cadastro e Login**|**1**|
|---|---|
|App de Clubes de Livro . . . . . . . . . . . . . . . . . . . . . . . . . .|. . . . . . . .<br>1|
|1. Visão Geral . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .|. . . . . . . .<br>1|
|2. Fluxo de Cadastro<br>. . . . . . . . . . . . . . . . . . . . . . . . . . .|. . . . . . . .<br>1|
|3. Verifcação por Código (Email)<br>. . . . . . . . . . . . . . . . . . . .|. . . . . . . .<br>2|
|4. Login<br>. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .|. . . . . . . .<br>2|
|5. Recuperação de Senha (“Esqueci minha senha”) . . . . . . . . . . .|. . . . . . . .<br>3|
|6. Estrutura de Sessão (Tokens)<br>. . . . . . . . . . . . . . . . . . . . .|. . . . . . . .<br>3|
|7. Regras de Autorização . . . . . . . . . . . . . . . . . . . . . . . . .|. . . . . . . .<br>4|
|8. Modelo de Dados (Backend) . . . . . . . . . . . . . . . . . . . . . .|. . . . . . . .<br>5|
|9. Segurança Complementar (Essencial — não opcional) . . . . . . . .|. . . . . . . .<br>5|
|10. Backlog de Segurança — Fase 2 . . . . . . . . . . . . . . . . . . .|. . . . . . . .<br>5|
|11. Resumo Executivo . . . . . . . . . . . . . . . . . . . . . . . . . . .|. . . . . . . .<br>5|



# **— Segurança Cadastro e Login** 

## **App de Clubes de Livro** 

_Documento de especificação técnica — última atualização: 07/09/2026_ 

## **1. Visão Geral** 

Este documento detalha o fluxo de cadastro, autenticação (login) e toda a arquitetura de segurança relacionada, incluindo estrutura de tokens, políticas de senha, verificação de identidade e regras de autorização. 

**Stack de referência:** Node.js (Express/NestJS) no backend, React Native + TypeScript no app. 

## **2. Fluxo de Cadastro** 

### **2.1 Dados coletados** 

|Campo|Obrigatório|Observações|
|---|---|---|
|Nome|Sim|—|
|Usuário (username)|Sim|Usado como credencial de login|
|Email|Sim|Usado para verifcação e recuperação de senha|
|Senha|Sim|Ver política de complexidade (seção 4.2)|
|Data de nascimento|Sim|Usada para verificar idade mínima de **18 anos** (base legal LGPD — art. 14 + cobrança recorrente do clube)|



### **2.2 Regras de validação do usuário (username)** 

- Tamanho: entre **4 e 20 caracteres** 

- Caracteres permitidos: letras, números, `_` e `.` 

- Não pode começar com número ou símbolo 

- Deve ser **único** no sistema (validação em tempo real durante o cadastro) 

1 

- Sem espaços, acentos ou símbolos especiais (mitiga riscos de injeção e problemas de codificação em URLs) 

### **2.3 Etapas do fluxo** 

1. Tela de boas-vindas →“Criar conta” 

2. Preenchimento dos dados básicos (nome, usuário, email, senha, idade opcional) 

3. Backend valida formato dos campos e verifica duplicidade de usuário/email 

4. Senha é processada com **bcrypt** (10-12 rounds) antes de ser persistida 

5. Sistema gera código de verificação de 6 dígitos e envia por email 

6. App exibe tela de confirmação — **bloqueada até o código ser validado** 

7. Após verificação bem-sucedida: aceite obrigatório de **Termos de Uso e Política de Privacidade** 

8. Conta é liberada →usuário cai na tela principal (sem clube — acesso a clubes só ocorre por convite) 

9. Preferência de gêneros literários: **etapa opcional** , pode ser preenchida depois, a qualquer momento, na tela de perfil 

## **3. Verificação por Código (Email)** 

Usado tanto no **cadastro** quanto na **recuperação de senha** , seguindo exatamente as mesmas regras. 

|Parâmetro|Valor|
|---|---|
|Formato do código|6 dígitos numéricos|
|Geração|`crypto.randomInt()` (nunca `Math.random()`)|
|Armazenamento|Hash SHA-256 (nunca texto puro)|
|Validade|5 minutos|
|Tentativas erradas permitidas|3|
|Ação após estourar tentativas|Código é invalidado; usuário deve solicitar<br>um novo|
|Cooldown para reenvio|2 minutos|
|Códigos simultâneos|Apenas 1 ativo por vez — gerar um novo<br>invalida o anterior automaticamente|



## **4. Login** 

### **4.1 Credenciais** 

- Login realizado via **usuário + senha** (não por email) 

- Mensagem de erro **sempre genérica** : _“Usuário ou senha incorretos”_ — nunca especifica qual campo está errado, evitando que um atacante descubra quais usuários existem na base 

### **4.2 Política de complexidade de senha** 

2 

|Regra|Valor|
|---|---|
|Tamanho mínimo|8 caracteres|
|Letra maiúscula|Obrigatória (mín. 1)|
|Letra minúscula|Obrigatória (mín. 1)|
|Número|Obrigatório (mín. 1)|
|Hash de armazenamento|bcrypt (10-12 rounds)|



### **4.3 Bloqueio por tentativas** 

- **3 tentativas de login erradas** →conta é **bloqueada** 

- Desbloqueio **somente** através do fluxo de recuperação de senha (troca obrigatória de senha via email) 

- **Sem rate limiting adicional por IP** — decisão consciente de manter apenas o controle por conta nesta fase 

### **4.4 Logout** 

- Logout manual **revoga o refresh token no banco** (marca `revoked_at` ), garantindo que a sessão não continue “viva” até expirar sozinha 

## **5. Recuperação de Senha (“Esqueci minha senha”)** 

Segue o mesmo padrão de verificação por código (seção 3), com particularidades: 

1. Usuário informa o **nome de usuário** na tela de login 2. Sistema localiza o email vinculado e envia o código — exibindo o email **mascarado** na tela (ex: `j***@email.com` ), sem revelar o endereço completo 

3. Usuário insere o código de 6 dígitos (mesmas regras de expiração/tentativas/cooldown) 4. Código validado →tela para definir **nova senha** (mesma política de complexidade da seção 4.2) 

5. Ao confirmar a nova senha: **todas as sessões ativas são invalidadas** — todos os refresh tokens do usuário são revogados, forçando novo login em todos os dispositivos 

Este fluxo também é o único caminho de desbloqueio de conta após 3 tentativas de login erradas. 

## **6. Estrutura de Sessão (Tokens)** 

### **6.1 Access Token (JWT)** 

- **Duração:** 15 minutos 

- **Payload:** 

```
{
```

```
"sub":"uuid-do-usuario",
"name":"Nomedousuário",
"clubs":[
{"id":"uuid-clube-1","role":1},
{"id":"uuid-clube-2","role":3}
],
"iat":1735689600,
```

3 

```
"exp":1735690500
```

```
}
```

- **Enum de papel (** **`role` ):** 

   - `1` = Fundador 

   - `2` = Co-fundador 

   - `3` = Membro 

- **Uso pretendido:** autenticação e dados de exibição rápida na interface (ex: mostrar lista de clubes e papel sem consulta extra ao banco) 

- **Restrição importante:** os dados do token são válidos apenas para fins de UI. **Não devem ser usados como fonte de verdade para autorizações sensíveis** (ver seção 7) 

### **6.2 Refresh Token** 

|Parâmetro|Valor|
|---|---|
|Duração<br>Rotação|5 horas<br>Não possui — função única é gerar novo<br>access token|
|Armazenamento|Tabela própria (`refresh_tokens`), vinculada a<br>usuário e dispositivo|
|Revogação|Ao logout manual (token daquele dispositivo)<br>e na troca de senha (todos os tokens do<br>usuário)|
|Expiração|Após 5h, exige login completo novamente<br>(usuário + senha)|



**Importante:** a cada renovação de access token via refresh, o backend busca os dados **atualizados** do usuário no banco (nome, clubes, papéis) — isso é o que resolve a janela de “dados congelados” do JWT a cada 15 minutos. 

## **7. Regras de Autorização** 

Princípio central: **JWT resolve autenticação (quem é você); autorização sensível sempre revalida contra o banco de dados.** 

Isso é necessário porque o token pode ficar desatualizado por até 15 minutos (tempo de vida do access token). Ações e verificações que **devem sempre consultar o banco diretamente** , nunca confiando apenas no conteúdo do token: 

- Envio de convites para clube (checar se o papel ainda é Fundador/Co-fundador) 

- Remoção de membros ou alteração de configurações do clube 

- Acesso a conteúdo de um clube (checar se o usuário ainda pertence e se o clube está com pagamento em dia) 

- Qualquer ação que dependa do status de pagamento do clube — **bloqueio por falta de pagamento é verificado a cada requisição** , nunca apenas no login 

4 

## **8. Modelo de Dados (Backend)** 

**Tabela** **`users`** 

- `id` , `username` , `email` , `password_hash` , `status` , `failed_login_attempts` , `birth_date` , `created_at` , `updated_at` 

- **`status`** (enum) — substitui os antigos booleans `email_verified` + `account_locked`: 

   - `pending_verification` — criou a conta, ainda não confirmou o email (seção 2.3, passo 6) 

   - `active` — email confirmado **e** Termos aceitos → app liberado 

   - `blocked` — 3 tentativas de login erradas; desbloqueio só via recuperação de senha (seção 4.3) 

- **`birth_date`** — obrigatório; idade mínima de 18 anos verificada no cadastro (doc LGPD) 

### **Tabela** **`terms_acceptances`** 

- `id` , `user_id` , `terms_version` , `accepted_at` , `consent_recommendations` (bool) , `consent_marketing` (bool) 

- Prova de conformidade LGPD (doc LGPD, seção 3): guarda o timestamp do aceite, a versão vigente dos Termos/Política e cada consentimento granular. 

- `consent_recommendations` e `consent_marketing` são **opt-in, nunca pré-marcados**, coletados em checkboxes **separados** do aceite dos Termos; recusá-los não bloqueia o cadastro nem o uso do app. 

### **Tabela** **`verification_codes`** 

- `id` , `user_id` , `code_hash` , `tipo` (cadastro / reset), `expires_at` , `attempts_count` 

### **Tabela** **`refresh_tokens`** 

- `id` , `user_id` , `token_hash` , `device_info` , `created_at` , `revoked_at` 

## **9. Segurança Complementar (Essencial — não opcional)** 

Itens considerados básicos de qualquer API, válidos desde o lançamento inicial: 

- **HTTPS obrigatório** em toda comunicação entre app e backend 

- **Validação e sanitização de entrada** em todos os endpoints (mesmo utilizando ORM) 

- **Chaves sensíveis** (gateway de pagamento, API de afiliados) armazenadas **apenas no backend** , nunca expostas no app 

- **Armazenamento seguro de tokens no app** : uso de `react-native-keychain` (Keychain no iOS / Keystore no Android) — nunca AsyncStorage puro 

- **Rate limiting de tentativas de código/login** via Redis (ou contadores no banco como alternativa mais simples na fase inicial) 

## **10. Backlog de Segurança — Fase 2** 

### Melhorias identificadas mas **não bloqueiam o lançamento inicial** : 

- Autenticação em duas etapas (2FA) para Fundador/Co-fundador 

- Notificação por email de login em novo dispositivo/local 

- Tela de “dispositivos conectados” com opção de logout remoto 

- CAPTCHA após tentativas repetidas de login/cadastro 

- Biometria local (Face ID / Touch ID) como camada de conveniência 

- Certificate pinning no app (mitigação de ataques man-in-the-middle) 

- Log de auditoria de eventos sensíveis (login, troca de senha, mudança de papel, convites enviados/revogados) 

- Scanner automatizado de dependências ( `npm audit` , Dependabot) 

## **11. Resumo Executivo** 

|Item|Decisão|
|---|---|
|Credenciais de login|Usuário + senha|
|Padrão de usuário|4-20 caracteres, letras/números/`_`/`.`, único|
|Padrão de senha|8+ caracteres, 1 maiúscula, 1 minúscula, 1<br>número|



5 

|Item|Decisão|
|---|---|
|Hash de senha|bcrypt (10-12 rounds)|
|Verifcação de cadastro/reset|Código de 6 dígitos, 5 min de validade, 3<br>tentativas, cooldown de 2 min|
|Bloqueio de conta|3 tentativas erradas →bloqueia até trocar<br>senha|
|Rate limiting por IP|Não implementado nesta fase|
|Access token|JWT, 15 min, contém dados de usuário e<br>clubes/papéis|
|Refresh token|5 horas, sem rotação, revogável|
|Logout|Revoga refresh token no banco|
|Troca de senha|Revoga todas as sessões ativas|
|Storage no app|`react-native-keychain`|
|Autorização sensível|Sempre revalidada no banco de dados|



6 

