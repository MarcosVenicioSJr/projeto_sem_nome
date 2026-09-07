# Architecture — Marginália

Living documentation of the technical decisions. Complements the product specs in
[`../product`](../product) and [`../specs`](../specs).

## Index

| Doc | Topic |
|---|---|
| [decisions.md](./decisions.md) | Architecture decision log (ADR) — **start here** |
| [shared-packages.md](./shared-packages.md) | Consuming `@org/contracts` / `@org/utils` / `@org/i18n` from api/web/mobile |
| [persistence.md](./persistence.md) | TypeORM + repository pattern, entities, migrations |
| [configuration.md](./configuration.md) | Environment variables (`@nestjs/config` + Zod validation) |
| [local-development.md](./local-development.md) | Bring up DB + app locally (docker-compose) |

## Layering (backend — `apps/marginalia-api`)

```
HTTP  ─►  Controller            thin routes; @Body/@Query typed by createZodDto
          │  (global ZodValidationPipe validates against @org/contracts)
          ▼
          Service               business logic; orchestrates repositories
          │
          ▼
          Repository (class)    domain vocabulary; isolates TypeORM
          │  @InjectRepository(Entity)
          ▼
          Entity  ◄──►  Postgres
```

## Shared packages

- **`@org/contracts`** (`packages/contracts`) — the single source of truth for
  shapes: Zod schemas + inferred types, grouped by domain (`common/`, `auth/`,
  `user/`), consumed by API, web and mobile.
- **`@org/utils`** (`packages/utils`) — pure TS helpers, no framework and no Zod
  (e.g. `maskEmail`). See [ADR-012](./decisions.md#adr-012--orgutils-pure-helpers-separate-from-contracts).
- **`@org/i18n`** (`packages/i18n`) — framework-free message catalogs + resolvers
  (`t`, `translateZodError`, `parseAcceptLanguage`). Code emits keys; text lives
  here. See [ADR-013](./decisions.md#adr-013--i18n-message-keys--per-locale-catalog).

Nothing in `@org/contracts` / `@org/utils` / `@org/i18n` imports a framework
(`@nestjs/*`, `react`, ORM). The API never reads `process.env` directly — only via
a typed `ConfigService`.
