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

## Frontend (scheduling-web)

O portal (`apps/scheduling-web`) fala com a API pelo **próprio Next**: o browser
chama `/api/...` e `next.config.js` (`rewrites`) repassa para a API — sem CORS.
Nome, slug e dono da empresa vêm da API (`GET /tenants/me` + `GET /user/me`) pela
sessão; nada disso é fixo em env vars.

| Var | Default | Descrição |
|---|---|---|
| `API_PROXY_TARGET` | `http://localhost:3000` | onde o Next repassa `/api/*` (lida pelo servidor Next, sem prefixo `NEXT_PUBLIC_`) |
| `NEXT_PUBLIC_PUBLIC_BOOKING_URL` | `https://barberadmin.app` | base do link público de agendamento (`{base}/t/{slug}`) |

Dados que ainda não existem na API (endereço, telefone e CNPJ da empresa) ficam só
no navegador, em `ShopProvider` (`admin/_lib/shop.tsx`).

**Sessão.** O token de acesso (JWT de 15 min, sem refresh) fica em
`localStorage` (`ba-session`). Ao expirar — ou num 401 — o usuário volta para `/login`.

> `nx build scheduling-web` falha se o shell tiver `NODE_ENV=development` (o `.env`
> raiz define isso e o Nx o repassa): use `NODE_ENV=production nx build scheduling-web`.
