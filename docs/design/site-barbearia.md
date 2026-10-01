# Site público da barbearia + agendamento online

Rotas (app `scheduling-web`):

| Rota                       | O que é                                                                  |
| -------------------------- | ------------------------------------------------------------------------ |
| `/t/:slug`                 | Site da barbearia: vitrine, trabalhos, tabela de serviços, como funciona |
| `/t/:slug/agendar`         | Agendamento em passos (aceita `?servico=<id>` para já vir marcado)       |
| `/t/:slug/cancelar/:token` | Link secreto de cancelamento enviado na confirmação                      |

O caminho `/t/:slug` é o mesmo que o admin já gera em **Meu site → Seu link de agendamento**.

Primeiro cliente: **Romario Designer Barbearia** (`/t/romario-designer`).

---

## 1. Discovery (premissas)

O pedido veio sem briefing formal; estas foram as premissas adotadas — revisar com o dono da barbearia.

- **Problema**: o cliente marca horário por WhatsApp/ligação, espera resposta e não vê a agenda real. O barbeiro perde tempo respondendo mensagem no meio do corte.
- **Usuário final**: homens de 16–35 anos, periferia/centro de Fortaleza, chegam **pelo link na bio do Instagram ou no WhatsApp**, no celular, com pressa. Nível técnico variado.
- **Objetivo do usuário**: garantir um horário com o barbeiro que ele gosta, sabendo quanto vai pagar.
- **Objetivo do negócio**: agenda cheia sem atender o telefone; vitrine que converte seguidor do Instagram em cliente na cadeira.
- **Contexto de uso**: 90% celular, uso eventual (a cada 2–4 semanas), ambiente casual.
- **Métricas de sucesso**: % de visitas ao site que viram agendamento; % de agendamentos concluídos por quem abriu `/agendar`; cancelamentos online vs. faltas.
- **Restrições técnicas**: Next.js 16 (App Router) + CSS Modules, API NestJS já pronta com endpoints públicos (`GET /t/:slug`, `GET /t/:slug/agenda/professionals`, `GET /t/:slug/agenda/slots`, `POST /t/:slug/agenda/appointments`, `POST /agenda/cancel/:token`). Regras da API: 1h de antecedência mínima, cancelamento online até 2h antes, limite diário por telefone.

## 2. Benchmark funcional

| Produto                                                  | Forte                                                                       | Fraco                                                                 | Levamos                                                                | Não copiamos                                                        |
| -------------------------------------------------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Booksy                                                   | Fluxo serviço → profissional → horário muito claro; "qualquer profissional" | Página do estabelecimento é genérica, igual para todos                | Ordem dos passos e "primeiro disponível"                               | Visual de marketplace, pedido de cadastro/login                     |
| Trinks / AppBarber                                       | Força no mercado BR, WhatsApp como canal                                    | Página pública pouco personalizável; cara de sistema                  | Linguagem brasileira, celular com DDD                                  | Layout de "portal" com abas e menus                                 |
| Sites de barbearia premium (Scissors & Scotch, Heritage) | Preço e duração visíveis antes do agendamento; marca forte                  | Agendamento em modal/terceiro, às vezes redireciona e perde o cliente | Transparência de preço/tempo antes de pedir dados                      | Estética "gentleman clube de whisky" que não conversa com o público |
| Guia "10 booking screens" (Teletype)                     | Checklist de telas e estados                                                | —                                                                     | Resumo sempre visível, confirmação com "adicionar à agenda" e cancelar | Checkout com pagamento online (a API não tem)                       |

## 3. Estratégia de UX

**Jornada**: Instagram/WhatsApp → `/t/romario-designer` → vê o trabalho (fotos) → vê preço → "Agendar" → escolhe serviço(s) → profissional (se houver mais de um) → dia/hora → nome + celular → confirmação com "adicionar à agenda" e link de cancelar.

- **Fluxo principal**: 3 ou 4 passos (o passo "Com quem?" só aparece se mais de um profissional faz a combinação escolhida).
- **Atalho**: cada linha da tabela de serviços no site abre o agendamento com aquele serviço já marcado.
- **Fluxos alternativos**: "Primeiro disponível" junta horários de todos os profissionais; voltar do celular volta um passo (history API), não sai do fluxo.
- **Fluxos negativos**:
  - Combinação que nenhum profissional faz junto → aviso inline, botão bloqueado.
  - Dia sem vaga → dia listrado na faixa + botão "Ver próximo dia com vaga".
  - Horário ocupado entre a escolha e o envio (409 `slotUnavailable`) ou em cima da hora (`leadTime`) → volta ao passo de horário com a lista atualizada e aviso.
  - Limite diário/validação da API → erro no campo certo ou aviso acima do formulário.
  - Falha de rede → mensagem + "Tentar de novo" (serviços, dia de horários, cancelamento).
  - Link de barbearia inexistente → tela "Barbearia não encontrada".
  - Cancelamento fora do prazo → mensagem da API + WhatsApp (se configurado).
- **Estados**: skeleton (tabela, opções, horários), pontos pulsando nos dias ainda carregando, vazio ("tabela sendo montada", "agenda cheia"), erro, sucesso (comanda).
- **Por que cada tela existe**: site = confiança (trabalho + preço); agendar = conversão; cancelar = reduz falta sem ligação. Nada de login, perfil ou "minhas reservas": a API não tem conta de cliente e o uso é eventual.

## 4. Arquitetura da informação

```
/t/:slug
├── Topo (nome, navalha, frase, CTA)
├── #1 Trabalhos  (girar o corte · lupa do degradê)
├── #2 Serviços   (tabela → atalho para /agendar?servico=)
├── #3 Como funciona (3 passos + regras 1h/2h)
└── Chamada final + contatos + rodapé
/t/:slug/agendar
├── Serviços → [Profissional] → Dia e hora → Seus dados
└── Confirmação (comanda, .ics, link de cancelar)
/t/:slug/cancelar/:token
```

Hierarquia: o site responde, nessa ordem, "é bom?" (trabalhos), "quanto custa?" (serviços), "é fácil?" (como funciona). O agendamento tem o resumo (comanda) sempre visível — lateral no desktop, barra inferior no celular.

## 5. Diagnóstico visual

Evitado de propósito: hero "título + subtítulo + 2 botões + imagem", grid de 3 cards iguais, gradiente roxo/rosa, glassmorphism, emojis, par Inter/Poppins, bege+serifa+terracota.

Preto + ouro **não** é escolha de tendência: é a marca que a barbearia já usa (logo com navalha em folha de ouro). O risco "fundo escuro + cor única" foi contornado com: textura de folha de ouro (não neon chapado), cobre e brilho como variações, e a assinatura do corte (abaixo) em vez de brilhos genéricos.

Referências visuais estudadas: sinalização de barbearia (letreiros condensados, quadro de preços com pontilhado), comanda de papel com picote, pente de máquina com numeração (#0, #1, #2…), e o próprio degradê como textura.

## 6. Design tokens

Todos em `apps/scheduling-web/src/app/t/_site/theme.module.css`.

| Token                   | Hex                   | Origem                                               | Papel                      |
| ----------------------- | --------------------- | ---------------------------------------------------- | -------------------------- |
| `--ink-950`             | `#0a0907`             | preto da logo (mediana dos pixels escuros), aquecido | fundo                      |
| `--ink-900/800/700/600` | `#12100d` … `#3d362b` | derivados do anterior                                | superfícies e linhas       |
| `--chalk`               | `#f4f0e8`             | branco do letreiro da logo                           | texto (17.5:1)             |
| `--chalk-muted`         | `#b8b0a1`             | —                                                    | texto secundário (9.3:1)   |
| `--chalk-faint`         | `#8f877a`             | —                                                    | legenda (5.6:1)            |
| `--gold-500`            | `#d8a019`             | **mediana** dos pixels dourados da logo              | ação / destaque (8.5:1)    |
| `--gold-300`            | `#f1c838`             | percentil 95 da folha (brilho)                       | realces pontuais           |
| `--gold-700`            | `#b66e08`             | percentil 5 da folha (cobre)                         | sombra do gradiente "foil" |
| `--on-gold`             | `#140f04`             | —                                                    | texto sobre ouro (8.2:1)   |
| `--ok` / `--danger`     | `#7cc49a` / `#f08a7b` | —                                                    | feedback                   |

Tipografia (auto-hospedada em `_site/fonts`, OFL):

- **Big Shoulders** (display) — nasceu da sinalização de Chicago: condensada, pesada, lida de longe como letreiro de barbearia; o eixo `opsz` fecha os títulos gigantes e abre os pequenos.
- **Archivo** (texto) — grotesca com algarismos tabulares (preço e hora alinhados) e eixo `wdth` para rótulos compactos.
- Escala fluida: `--t-hero` (até 184px), `--t-h2`, `--t-h3`, `--t-lead`, `--t-body` 16px, `--t-small`, `--t-micro`.

Espaço: base 4px (`--s-1`…`--s-10`), `--gutter` fluido (16–48px), largura máxima 78rem.

Componentes: `Button` (primary/ghost/quiet, md/lg, loading, disabled), `CutTitle`, `Razor`, `Eyebrow`, `FadeRule`, opções (checkbox/radio), faixa de dias, grade de horários, campos, comanda, estados vazios/erro/skeleton — todos com hover/focus/active/disabled definidos uma vez.

## 7. Assinatura visual — "o corte da navalha"

1. **A navalha abre.** A navalha da logo foi redesenhada em SVG com cabo e lâmina girando no mesmo rebite. No topo ela abre ao carregar; na chamada final abre ao entrar na tela; no cancelamento ela **fecha**. A animação comunica estado (aberto para atender / horário liberado).
2. **Títulos cortados.** Todo título de seção é "fatiado" na diagonal da lâmina (~22°): um fio de ouro atravessa o texto e as metades deslizam, deixando um vão fino — como a linha de um degradê desenhado.
3. **Canto cortado.** Botões, fotos, opções e comanda têm um canto chanfrado no mesmo ângulo.
4. **Degradê de pontos.** Malha de pontos que rareia separa as seções — é literalmente um fade. Na faixa de dias, os 4 pontos mostram a disponibilidade do dia.
5. **Pente da máquina.** As seções são numeradas #1, #2, #3 como os pentes de máquina.

Reconhecível em segundos porque tudo deriva de um objeto só — a navalha da logo — e não de um efeito da moda.

## 8. Acessibilidade

- Contraste AA/AAA em todos os pares (números acima).
- `CutTitle` expõe o texto real para leitores de tela; as camadas visuais são `aria-hidden`.
- Foco visível próprio (anel duplo escuro + ouro); botões com canto cortado pintam o chanfro no fundo em vez de `clip-path`, para o anel não ser cortado.
- Alvos de toque ≥ 44px; botões principais 48–60px.
- Opções são `input` reais (checkbox/radio) com label; dias são `role="radio"`; horários `aria-pressed`.
- Visualizador de ângulos: teclado (setas), botões por ângulo, `aria-label` com posição; autoplay para ao interagir, fora da tela e com movimento reduzido.
- Lupa: botão para abrir sem mouse, setas movem a lente.
- Ao trocar de passo o foco vai para o título do passo; erros de campo com `aria-invalid` + `aria-describedby`.
- `prefers-reduced-motion`: sem animações (estados finais aparecem direto). Sem JS: títulos inteiros, navalha aberta por CSS, conteúdo nunca fica escondido.
- Informação nunca só por cor: dia lotado é listrado e tem rótulo; selecionado muda preenchimento.

## 9. Responsividade

- **Celular (principal)**: CTA de agendar numa barra inferior (zona do polegar) que só aparece quando nenhum outro botão de agendar está visível; no fluxo, a comanda vira barra inferior com total + botão, e abre os detalhes num toque. Faixa de dias rolável com snap.
- **Tablet**: mesmas regras do celular até 900/960px, com mais respiro.
- **Desktop**: navegação por âncoras no topo, navalha grande ao lado do nome, fotos em ritmo quebrado (a de detalhe desce), comanda fixa na lateral.

## 10. Microinterações (todas informam algo)

| Interação                                         | O que comunica                           |
| ------------------------------------------------- | ---------------------------------------- |
| Navalha abrindo / fechando                        | pronto para atender / horário liberado   |
| Fio de ouro cortando o título                     | nova seção entrou em foco                |
| Navalha desce e gira ao rolar (CSS scroll-driven) | progresso de leitura saindo do topo      |
| Linha da tabela ganha fatia de ouro + "Agendar →" | a linha é clicável e leva ao agendamento |
| Pontos pulsando nos dias                          | horários ainda carregando                |
| Barra de progresso segmentada                     | em que passo estou                       |
| Botão com spinner + "Confirmando…"                | pedido em andamento, não clicar de novo  |

## 11. Arquitetura do código

```
src/app/t/
├── [slug]/layout.tsx               fontes, tema, faixa de demo, metadata
├── [slug]/page.tsx                 site
├── [slug]/agendar/page.tsx         agendamento
├── [slug]/cancelar/[token]/page.tsx
└── _site/
    ├── theme.module.css            tokens
    ├── content.ts                  conteúdo editorial por slug (fotos, frase, contatos)
    ├── booking.ts (+ .spec.ts)     regras puras: catálogo, elegíveis, datas, máscara, .ics
    ├── gateway.ts                  API real ou demonstração (mesma interface)
    ├── useShopData.ts / hooks.ts / format.ts
    ├── components/                 Razor, CutTitle, Button, Bits, icons, DemoBanner
    ├── home/                       seções do site
    ├── agendar/                    passos, comanda, confirmação, cancelamento
    ├── assets/                     fotos dos trabalhos (webp)
    └── fonts/                      Big Shoulders + Archivo (woff2, OFL)
```

### Para o dono preencher

`_site/content.ts` → `contact`: WhatsApp, Instagram, endereço, link do Maps e horário de funcionamento. Campos vazios não aparecem na página (nada é inventado).

O slug `romario-designer` deve ser o mesmo do tenant cadastrado na API.

### Modo demonstração

`NEXT_PUBLIC_BOOKING_DEMO=1` troca a API por dados fictícios para apresentar o site sem backend. Uma faixa fixa avisa que nada é reservado.

## 12. Revisão crítica

1. **Parece template/IA?** Não: nenhum bloco padrão de landing; tudo nasce da navalha da logo e do vocabulário da barbearia (pente, comanda, degradê, quadro de preços).
2. **Outro app do segmento ficaria igual?** O esqueleto de agendamento seria parecido (é o que o usuário espera); a camada de marca não — a navalha, o corte e as fotos giratórias são desta barbearia. Para outro cliente, o perfil genérico mantém o sistema e troca o conteúdo.
3. **Identidade reconhecível?** Sim — a navalha abrindo e os títulos cortados aparecem nos primeiros 2 segundos.
4. **Decisão sem justificativa?** Não encontrada; ver seções 3–10.
5. **Tendência sem propósito?** O desfoque do cabeçalho só existe quando há conteúdo passando por baixo (legibilidade). Sem glassmorphism decorativo.
6. **Estética prejudicou usabilidade?** O corte dos títulos é leve (≈2% do tamanho da fonte) e o texto real vai para leitores de tela.
7. **Funciona sem animação?** Sim: com `prefers-reduced-motion` os estados finais aparecem direto (verificado); sem JS o CSS mantém tudo visível.
8. **DS consistente?** Um só set de tokens, um set de ícones (traço 1.75, pontas retas), mesmo canto cortado em tudo.
9. **Pendências de a11y/responsivo?** Contatos e horário de funcionamento dependem de dados que a barbearia ainda não passou.
10. **Propósito em segundos?** Nome gigante + "Agendar meu horário" acima da dobra, com as 3 garantias (sem cadastro, horários reais, cancelar pelo link).
