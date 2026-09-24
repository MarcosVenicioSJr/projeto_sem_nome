# Configuration — Environment Variables

> Decision: [ADR-007](./decisions.md#adr-007--configuration-nestjsconfig--zod-validation).

## How it works

- A single `.env` at the monorepo **root**. It is read:
  - by **scheduling-api** via `ConfigModule` (`apps/scheduling-api/src/app/config/`);
  - by **docker-compose** (`${VAR}` substitution).
- `.env.example` is versioned and is the reference. `.env` is in `.gitignore`.
- `env.schema.ts` (Zod) is the **only door** to `process.env`. Validated at boot:
  a missing/invalid variable → the app **won't start**, with the list of errors.
- Access in code: `ConfigService<Env, true>` — `config.get('DB_HOST', { infer: true })`.
  **Never** `process.env.X` directly.

```
.env  ──►  ConfigModule.forRoot({ validate: validateEnv })  ──►  ConfigService (typed)
      └──►  docker-compose.yml  (${DB_USER}, ${DB_PORT}, ...)
```

## Variables

| Var | Default | Description |
|---|---|---|
| `NODE_ENV` | `development` | `development` \| `test` \| `production` |
| `PORT` | `3000` | API HTTP port |
| `JWT_SECRET` | — (**required**, ≥16 chars) | JWT signing secret. TTLs (15m/5h) are fixed in code, not env |
| `DB_HOST` | `localhost` | Postgres host |
| `DB_PORT` | `5432` | Postgres port |
| `DB_USER` | `scheduling` | database user |
| `DB_PASSWORD` | `scheduling` | database password |
| `DB_NAME` | `scheduling` | database name |
| `DB_LOGGING` | `false` | log SQL |
| `MAIL_HOST` | `localhost` | SMTP host (local: Mailpit; prod: e.g. `in-v3.mailjet.com`) |
| `MAIL_PORT` | `1025` | SMTP port (Mailjet: `587`) |
| `MAIL_SECURE` | `false` | implicit TLS (port 465) |
| `MAIL_USER` | `` | SMTP user; empty = no auth (Mailpit) |
| `MAIL_PASSWORD` | `` | SMTP password/secret |
| `MAIL_FROM` | `Scheduling <no-reply@scheduling.local>` | sender |

Boolean vars accept exactly `"true"` / `"false"`. The DB schema is managed by
Atlas ([migrations.md](./migrations.md)) — there is no `DB_SYNCHRONIZE`.

## Adding a variable

1. New field in `apps/scheduling-api/src/app/config/env.schema.ts` (with a default, or required).
2. A line in `.env.example` (and in your `.env`).
3. Use it via `config.get('NEW_VAR', { infer: true })`.

## Generate a `JWT_SECRET`

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

## Locale (i18n)

The response language is picked per request from `Accept-Language`
(`parseAcceptLanguage` in `@org/i18n`), default `en`. Not an env var. See
[ADR-013](./decisions.md#adr-013--i18n-message-keys--per-locale-catalog).

## Frontend (scheduling-web) — variáveis `NEXT_PUBLIC_*`

O portal administrativo (`apps/scheduling-web/src/app/admin`) não deve ter
nome, slug ou dados da barbearia fixos no código. Enquanto a API não expõe
`Tenant`/`Owner` para o front, os valores padrão de `ShopConfig`
(`admin/_lib/shop.tsx`) vêm destas variáveis de ambiente, lidas em build
time pelo Next.js (por isso o prefixo `NEXT_PUBLIC_`):

| Var | Default | Descrição |
|---|---|---|
| `NEXT_PUBLIC_SHOP_NAME` | `Minha Barbearia` | nome exibido na sidebar, Meu Site e Configurações |
| `NEXT_PUBLIC_SHOP_SLUG` | `minha-barbearia` | slug usado no link público `/t/:slug` |
| `NEXT_PUBLIC_SHOP_ADDRESS` | — | endereço da barbearia |
| `NEXT_PUBLIC_SHOP_PHONE` | — | telefone/WhatsApp |
| `NEXT_PUBLIC_SHOP_CNPJ` | — | CNPJ |
| `NEXT_PUBLIC_SHOP_OWNER_NAME` | `Dono da barbearia` | nome do dono (iniciais do avatar, saudação do Dashboard) |
| `NEXT_PUBLIC_SHOP_OWNER_EMAIL` | `dono@example.com` | e-mail do dono (tela Usuários) |
| `NEXT_PUBLIC_PUBLIC_BOOKING_URL` | `https://barberadmin.app` | base do link público de agendamento (`{base}/t/{slug}`) |

Essas variáveis não passam pelo `env.schema.ts` do `scheduling-api` — são
lidas diretamente pelo Next.js no bundle do cliente. Quando a API passar a
expor o tenant autenticado, `ShopProvider` deve buscar esses dados por HTTP
em vez de env vars.
