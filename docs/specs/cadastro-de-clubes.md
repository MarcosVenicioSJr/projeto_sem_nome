# **Cadastro de Clubes** 

App de Clubes de Livro — Especificação Funcional e Técnica _Última atualização: 05/09/2026_ 

## **1. Visão Geral** 

Este documento detalha o fluxo de criação (cadastro) de um clube dentro do aplicativo, incluindo requisitos de acesso, estrutura de cobrança, papéis e permissões, limites de membros e regras de continuidade do clube. O clube é a unidade paga do produto: fechado, por convite, com uma taxa fixa mensal de R$ 20,00. 

## **2. Fluxo de Criação do Clube** 

### **2.1 Quem pode criar um clube** 

Apenas usuários com **e-mail verificado** podem iniciar a criação de um clube. Essa é a única barreira de elegibilidade nesta etapa — não há necessidade de assinatura prévia de plano ou aprovação manual. 

### **2.2 Dados coletados na criação** 

- **Nome do clube** — obrigatório. Não precisa ser único no sistema (pode repetir). 

- **Descrição/propósito** — opcional. 

- **Foto/capa do clube** — opcional. Caso não seja enviada, é atribuído um avatar padrão. 

- **Co-fundador** — opcional nesta etapa. Pode ser definido depois, através do mesmo mecanismo de convite usado para membros comuns, apenas com o papel diferenciado. 

### **2.3 Etapas do fluxo** 

- 1. Usuário com e-mail verificado acessa a opção "Criar clube". 

- 2. Preenche nome, descrição (opcional) e foto (opcional). 

- 3. Escolhe o método de pagamento: Pix ou Cartão (ver seção 3). 

- 4. Confirma a criação — o sistema entra em estado de **aguardando confirmação de pagamento** . 

- 5. Após a confirmação do pagamento, o clube é efetivamente criado e o usuário passa a ser o **Fundador** (papel 1). 

- 6. O clube nasce sem membros adicionais (exceto o fundador). Co-fundador e membros entram somente por convite, em um momento posterior. 

### **2.4 Regra crítica: criação condicionada ao pagamento** 

O clube **só é criado no banco de dados após a confirmação do pagamento** — não existe estado de clube "criado, mas inadimplente" logo na origem. Como a confirmação de pagamento é assíncrona (o Pix depende do webhook da AbacatePay; o cartão depende da confirmação da App Store/Play Store), o aplicativo precisa exibir uma tela de espera com um **tempo limite (timeout)** . Se a confirmação não chegar dentro do prazo estipulado, os dados preenchidos são descartados e nenhum clube é criado. 

## **3. Estrutura de Cobrança** 

O clube tem uma mensalidade fixa de **R$ 20,00/mês** , cobrada da entidade "clube" — não importa qual pessoa efetivamente paga. A cobrança começa **imediatamente na criação** , sem período de teste. Se o 

pagamento não for mantido em dia, o acesso do clube é bloqueado até a regularização (sem exclusão de dados). 

### **3.1 Métodos de pagamento suportados** 

|**Método**|**Integração**|**Observações**|
|---|---|---|
|Pix|AbacatePay|Cobrança recorrente via API/webhook. Integração<br>feita pelo backend (a chave de API nunca fica<br>exposta no app). Confirmação assíncrona via<br>webhook.|
|Cartão de crédito|In-App Purchase (App Store /<br>Google Play)|Processado pelas plataformas de pagamento<br>nativas das lojas, dentro das regras vigentes para<br>o mercado brasileiro em 2026.|



### **3.2 Troca de método de pagamento** 

O método de pagamento (Pix ou Cartão) pode ser trocado **a qualquer momento** pelo responsável pela cobrança do clube. O mecanismo operacional dessa transição (evitar cobrança duplicada ou lacuna de cobertura entre o cancelamento de um método e a ativação do outro) ainda está em aberto — ver seção 7. 

### **3.3 Direito de arrependimento (CDC)** 

Em conformidade com o Código de Defesa do Consumidor, é garantido ao fundador um prazo de **7 (sete) dias corridos** , a contar da confirmação do pagamento, para exercer o direito de arrependimento com **reembolso integral** do valor pago, sem necessidade de justificativa. Esse prazo se aplica à criação do clube por se tratar de contratação realizada fora de estabelecimento físico (dentro do aplicativo). 

- Pix (AbacatePay): reembolso processado via API do próprio gateway. 

- Cartão (IAP): reembolso depende dos mecanismos de reembolso da Apple/Google — o usuário pode solicitar diretamente à loja, e o desenvolvedor também pode iniciar via API, mas a decisão final não é integralmente controlada pelo aplicativo. 

## **4. Papéis e Permissões** 

|**Papel**|**Enum**|**Origem**|**Pode editar dados do**<br>**clube**|
|---|---|---|---|
|Fundador|1|Quem cria o clube (após pagamento<br>confirmado)|Sim|
|Co-fundador|2|Convidado pelo fundador, a qualquer<br>momento após a criação|Sim|
|Membro|3|Convidado pelo fundador ou co-fundador|Não|



Nome do clube, descrição e foto/capa podem ser editados a qualquer momento por **Fundador** ou **Co-fundador** . Membros comuns não têm permissão de edição. 

## **5. Limites do Clube** 

Cada clube tem um limite máximo de **20 membros** (contando fundador e co-fundador). Convites que ultrapassem esse limite devem ser bloqueados pelo backend antes do envio. 

## **6. Continuidade do Clube (Sucessão do Fundador)** 

Caso o fundador saia do clube (ou exclua sua conta de usuário), a titularidade é repassada automaticamente, seguindo esta ordem de prioridade: 

- 1. Se houver **co-fundador** definido, ele assume automaticamente o papel de fundador. 

- 2. Caso **não exista co-fundador** , a titularidade passa automaticamente para o **membro mais antigo** do clube (por ordem de entrada). 

## **7. Pontos em Aberto** 

#### **Mecanismo de transição entre métodos de pagamento** 

- Definir se a troca de método (Pix para Cartão ou vice-versa) só passa a valer no fim do ciclo de cobrança vigente, ou se é imediata assumindo risco de sobreposição/lacuna de cobrança. 

- Tratar as limitações técnicas: o backend não pode ativar uma assinatura de IAP sem ação do usuário dentro do app, nem cancelar uma assinatura de IAP remotamente. 

_Documento gerado a partir das definições do projeto do App de Clubes de Livro. Sujeito a revisão conforme o projeto avance._ 

