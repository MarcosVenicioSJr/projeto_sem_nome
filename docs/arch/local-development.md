# Local Development

## Prerequisites

- Node (version from `.nvmrc`/`package.json`), the repo's package manager (here: **npm**).
- Docker + Docker Compose.
- The `atlas` CLI (`winget install ariga.atlas` on Windows) — for migrations.

## First time

```bash
npm install
cp .env.example .env          # adjust JWT_SECRET if you want
docker compose up -d          # Postgres + Mailpit
npx nx run scheduling-api:migrate-apply   # create the schema (Atlas)
```

- Postgres: `localhost:5432` (user/pass/db = `scheduling`).
- **Mailpit** (email catcher): SMTP on `localhost:1025`, UI on
  http://localhost:8025 — every email the API sends lands here (the signup
  verification code shows up in that inbox).

Schema changes later: `migrate-diff -- <name>` then `migrate-apply` — see
[migrations.md](./migrations.md).

## Run the API

```bash
npx nx serve scheduling-api
# http://localhost:3000/api
```

Onboarding and auth (multitenant). The owner creates the company and its team
(employees = professionals who provide services, and managers). The end
customer has **no account**: they book with just a name and a phone.

```
POST  /api/tenants                   { tenant: { name, slug }, owner: { name, email, phone, password } }
POST  /api/auth/member/login         { email, password }  -> { accessToken, accessTokenExpiresInSeconds }   (owner, manager or employee)
GET   /api/user/me                   Authorization: Bearer <accessToken>
POST  /api/members/employees         (owner/manager) { name, email, phone, password, role?: 'employee'|'manager', commissionRate? }
GET   /api/members/employees         (owner/manager)
PATCH /api/members/employees/:id     (owner/manager) { name?, email?, phone?, commissionRate? }
```

Catalog, agenda and finance (all scoped to the token's tenant; see
[ADR-018](./decisions.md#adr-018--barbershop-management-domain-no-client-accounts-generic-professionals)):

```
CRUD  /api/services                          (owner/manager)         service = just a name
GET/PUT/DELETE /api/members/:id/services     (owner/manager, or the employee themself)  price + duration per professional
GET/PUT /api/members/:id/schedule            weekly hours (PUT replaces the week)
GET/POST/DELETE /api/members/:id/time-off    days off / blocked windows

GET   /api/t/:slug                           public: company name/slug
GET   /api/t/:slug/agenda/professionals      public: professionals + their services
GET   /api/t/:slug/agenda/slots?professionalId=&date=YYYY-MM-DD&serviceIds=a,b
POST  /api/t/:slug/agenda/appointments       public: { professionalId, serviceIds[], clientName, clientPhone, startAt } -> booking + cancelToken
POST  /api/agenda/cancel/:token              public: client cancels via link (until 2h before)

GET   /api/agenda?date=&professionalId?      staff agenda (employees see only their own)
PATCH /api/agenda/:id/done                   { amount, paymentMethod: cash|pix|debit|credit } -> records revenue
PATCH /api/agenda/:id/cancel                 counter cancellation (also how a no-show is handled)

CRUD  /api/finance/expenses                  (owner/manager)
GET   /api/finance/commissions?date=         (owner/manager) daily closing per professional
GET   /api/finance/reports/revenue?month=YYYY-MM   (owner/manager)
GET   /api/finance/reports/clients?month=YYYY-MM   (owner/manager)
CRUD  /api/stock-items  + PATCH /:id/quantity      internal consumables (any member adjusts quantity)
CRUD  /api/products                          (owner/manager) items for sale
```

## Run the web portal

```bash
npx nx run scheduling-web:dev -- --port 4200   # http://localhost:4200
```

The API must be up on `:3000` (see above). Open `/cadastro` to create a company
(you become its owner) or `/login`. The portal calls `/api/...` on the Next server,
which proxies to the API. Modules already wired to the API: Serviços, Equipe
(profissionais, horários, comissão), Agenda, Produtos, Estoque, Financeiro e
Relatórios. Dashboard, Configurações e Meu Site still use local mock data (their
specs have no business rules yet).

Send `Accept-Language: pt-BR` (or `en`) to pick the response language.

## e2e

```bash
npx nx e2e scheduling-api-e2e
```

Self-bootstrapping: `globalSetup` brings up docker-compose, applies migrations,
and starts the built API. Set
`E2E_SKIP_INFRA=true` if you already have the stack + schema up. See
[ADR-016](./decisions.md#adr-016--e2e-black-box-self-bootstrapping-infra).

## Useful commands

```bash
docker compose logs -f db      # database logs
docker compose down            # stop containers (data stays in the volume)
docker compose down -v         # stop and DELETE the data

npx nx run-many -t typecheck build test -p scheduling-api contracts utils i18n
npx nx sync                    # sync tsconfig references
```

## Notes

- `nx test` for the pure packages (`contracts`, `utils`, `i18n`) is broken (a
  vitest 4 bug — see [decisions.md](./decisions.md#known-gaps)); run
  `cd packages/<name> && npx vitest run`.
- Migrations (Atlas): see [migrations.md](./migrations.md).
