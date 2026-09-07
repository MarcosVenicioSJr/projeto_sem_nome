# Configuration — Environment Variables

> Decision: [ADR-007](./decisions.md#adr-007--configuration-nestjsconfig--zod-validation).

## How it works

- A single `.env` at the monorepo **root**. It is read:
  - by **marginalia-api** via `ConfigModule` (`apps/marginalia-api/src/app/config/`);
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
| `DB_USER` | `marginalia` | database user |
| `DB_PASSWORD` | `marginalia` | database password |
| `DB_NAME` | `marginalia` | database name |
| `DB_LOGGING` | `false` | log SQL |
| `MAIL_HOST` | `localhost` | SMTP host (local: Mailpit; prod: e.g. `in-v3.mailjet.com`) |
| `MAIL_PORT` | `1025` | SMTP port (Mailjet: `587`) |
| `MAIL_SECURE` | `false` | implicit TLS (port 465) |
| `MAIL_USER` | `` | SMTP user; empty = no auth (Mailpit) |
| `MAIL_PASSWORD` | `` | SMTP password/secret |
| `MAIL_FROM` | `Marginália <no-reply@marginalia.local>` | sender |

Boolean vars accept exactly `"true"` / `"false"`. The DB schema is managed by
Atlas ([migrations.md](./migrations.md)) — there is no `DB_SYNCHRONIZE`.

## Adding a variable

1. New field in `apps/marginalia-api/src/app/config/env.schema.ts` (with a default, or required).
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
