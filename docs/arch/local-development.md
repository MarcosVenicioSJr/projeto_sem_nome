# Local Development

## Prerequisites

- Node (version from `.nvmrc`/`package.json`), the repo's package manager (here: **npm**).
- Docker + Docker Compose.

## First time

```bash
npm install
cp .env.example .env          # adjust JWT_SECRET if you want
docker compose up -d          # brings up Postgres + Adminer + Mailpit
```

- Postgres: `localhost:5432` (user/pass/db = `marginalia`).
- Adminer (web, to browse tables): http://localhost:8080 — system *PostgreSQL*,
  server `db`, user/password `marginalia`.
- **Mailpit** (email catcher): SMTP on `localhost:1025`, UI on
  http://localhost:8025 — every email the API sends lands here (the signup
  verification code shows up in that inbox).

With `DB_SYNCHRONIZE=true`, TypeORM creates the tables on the API's first boot.

## Run the API

```bash
npx nx serve marginalia-api
# http://localhost:3000/api
```

Signup flow (Security spec) — the verification code arrives in **Mailpit**
(http://localhost:8025):

```
POST /api/auth/register        { name, username, email, password, birthDate }
  -> { registrationId, ... }
POST /api/auth/verify-email     { registrationId, code }
POST /api/auth/accept-terms     { registrationId, termsVersion, acceptedTerms, consent* }
POST /api/auth/login            { username, password }  -> { accessToken, refreshToken }
GET  /api/user/me               Authorization: Bearer <accessToken>
```

Send `Accept-Language: pt-BR` (or `en`) to pick the response language.

## Useful commands

```bash
docker compose logs -f db      # database logs
docker compose down            # stop containers (data stays in the volume)
docker compose down -v         # stop and DELETE the data

npx nx run-many -t typecheck build test -p marginalia-api contracts utils i18n
npx nx sync                    # sync tsconfig references
```

## Notes

- `nx test` for the pure packages (`contracts`, `utils`, `i18n`) is broken (a
  vitest 4 bug — see [decisions.md](./decisions.md#known-gaps)); run
  `cd packages/<name> && npx vitest run`.
- Migrations: see [persistence.md](./persistence.md#synchronize-vs-migrations).
