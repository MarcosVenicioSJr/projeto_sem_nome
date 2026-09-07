# Architecture Decision Records (ADR)

Chronological log of the decisions taken. Short format: Context / Decision /
Consequences. Last updated: 2026-09-07.

---

## ADR-001 — Nx monorepo, "TS solution setup"

**Context.** One repo with the API (NestJS), web (Next.js) and mobile (React
Native), needing to share code with type safety.

**Decision.** Nx 23 in *TS solution* mode (npm workspaces + project references).
Each project has its own `package.json` (`@org/<name>`); cross-project imports
resolve by package name, via the workspace symlink + the `@org/source` export
condition (dev consumes the `.ts` source; build consumes `dist/`). `npx nx sync`
keeps the `tsconfig` `references` up to date.

**Consequences.** No `paths` in `tsconfig.base.json`. When creating/relating
projects, run `nx sync`. Always drive tasks through `npx nx ...` (never the raw
tool).

---

## ADR-002 — `@org/contracts`: shared contracts in Zod

**Context.** The API validates input; web/mobile validate forms and the response.
Keeping three copies of the rules (one per app) diverges on the first change.

**Decision.** One `@org/contracts` package with **Zod schemas + `z.infer`
types**, consumed by all three apps. Organized **by domain** (not by file type —
ref: Nx library types, Feature-Sliced Design, DDD):

1. `common/` — reusable value objects (`emailSchema`, `passwordSchema`, `usernameSchema`, `otpCodeSchema`, `genreSchema`, `birthDateSchema`, `paginationQuerySchema`).
2. `auth/`, `user/` — schemas per use case / screen step, composed from `common/`.
3. Nest DTO (`createZodDto`) — thin shell that wires the schema to the pipe.

**Rules.** Nothing in `@org/contracts` imports `@nestjs/*`, `class-validator`,
ORM decorators or `react`. Only `zod` + TS. `src/index.ts` is the public API —
only what's exported there is importable by the apps.

**Corollary (general monorepo rule).** Any framework-free code used by more than
one app/module lives in `packages/`, never duplicated.
**Pure helper ≠ schema**: `@org/contracts` is Zod only; utility functions
(string/date/number, no Zod) go to `@org/utils` (ADR-012). User-facing strings go
to `@org/i18n` as keys (ADR-013).

**Consequences.** Format business rules live in one place. Change the contract →
`nx build contracts` and the apps pick it up immediately (`@org/source` condition).

---

## ADR-003 — Validation with Zod, not class-validator

**Context.** NestJS ships `class-validator`/`class-transformer` by default.

**Decision.** Zod, so we can **share the same schema** with web/mobile
(class-validator lives in class decorators, not reusable on the front end). Zod
also gives `z.infer` (type derived from the schema, no duplication) and
coercion/`default`.

**Consequences.** Nest DTOs are not decorator classes; they are produced by
`createZodDto(schema)`. Needed a custom pipe (ADR-004).

---

## ADR-004 — Global validation pipe + `createZodDto`

**Context.** Two ways to apply the schema: `new ZodValidationPipe(schema)` on
every route, or a global pipe that finds the schema from the parameter type.

**Decision.** A **global** pipe via `APP_PIPE`. `createZodDto(schema)` returns a
class carrying the schema in `static zodSchema`; `ZodValidationPipe` reads it off
the argument's `metatype` and parses/coerces. On failure the raw `ZodError`
propagates and `AllExceptionsFilter` turns it into a localized 422 (ADR-013).

**Consequences.** Controllers are `@Body() dto: XDto`, with no `new ...Pipe()`
and no repeating the schema per route. Impossible to forget validation on a new
route. Cost: one indirection (the reader must know the pipe exists) — documented
in the module.

Acceptable alternative for one-offs (script, microservice): the per-parameter
pipe. See [code](../../apps/marginalia-api/src/app/common/zod.dto.ts).

---

## ADR-005 — Auth: stateless JWT + custom guard

**Context.** Security spec §6: 15-minute JWT access token with
`{ sub, name, clubs:[{id,role}] }`; 5-hour refresh, revocable.

**Decision.** `@nestjs/jwt` (no `passport` — a custom guard is enough and avoids
a second lib). `JwtAuthGuard` validates signature/expiry and **`parse`s the
payload against `accessTokenPayloadSchema` from `@org/contracts`** before
attaching it to `req.user`. `@CurrentUser('sub')` reads the id. The secret comes
from `ConfigService` (`JWT_SECRET`); TTLs are constants fixed by the spec
(`auth/jwt/jwt.config.ts`). Club `role` is a numeric enum `1|2|3`
(Founder/Co-founder/Member).

**Consequences.** **Sensitive** authorization does **not** trust the token — it
revalidates against the DB on every request (spec §7). Refresh token: SHA-256
hash in the `refresh_tokens` table; real revocation (logout / password change)
already has a repository, the routes are still missing.

---

## ADR-006 — Persistence: TypeORM + repository pattern

**Context.** We need an ORM. The team is comfortable with the NestJS way.

**Decision.** **TypeORM** (official `@nestjs/typeorm` integration), Postgres.
Instead of injecting `Repository<Entity>` straight into services, each aggregate
has a **domain repository class** (`UsersRepository`,
`VerificationCodesRepository`, …) that wraps `@InjectRepository(Entity)` and
exposes business-named methods (`existsByUsername`, `issue`, `revokeAllForUser`).
Services depend on those classes, never on TypeORM.

Entities and repositories are centralized in
`apps/marginalia-api/src/app/database/`. A single `DatabaseModule` opens the
connection (`forRootAsync` reading `ConfigService`) and exports the repositories;
`AuthModule` and `UserModule` just import it.

Dev uses `DB_SYNCHRONIZE=true` (TypeORM creates/alters tables). **Migrations** are
deferred until the schema stabilizes — `data-source.ts` is ready. Details in
[persistence.md](./persistence.md).

**Consequences.** Swapping the ORM later touches only the `database/` folder.
Services are testable with a repository mock (no DB). `synchronize` is **never**
used in production.

---

## ADR-007 — Configuration: `@nestjs/config` + Zod validation

**Context.** Secrets and DB parameters out of the code; fail early if missing.

**Decision.** `@nestjs/config` global. `env.schema.ts` (Zod) is the **only door**
to `process.env` — validated at boot; invalid env → app won't start. Typed
access: `ConfigService<Env, true>`. One `.env` at the monorepo **root**, the same
file `docker-compose` consumes. `.env.example` is versioned; `.env` is
`.gitignore`d. See [configuration.md](./configuration.md).

**Consequences.** No `process.env.X` scattered around. Adding a variable = touch
only `env.schema.ts` + `.env.example`.

---

## ADR-008 — Docker Compose for local infra

**Decision.** `docker-compose.yml` at the root brings up Postgres 16 (+ Adminer
to inspect, + Mailpit for email — ADR-011), reading credentials from the root
`.env`, with a named volume and a healthcheck. See
[local-development.md](./local-development.md).

**Consequences.** `docker compose up -d` + `nx serve marginalia-api` and it runs.
No Postgres installed on the machine.

---

## ADR-009 — Minimum signup age: 18

**Context.** The screen said "optional"; Security spec §2.1 said "not required";
the LGPD doc recommended 18 (art. 14 + the club's recurring charge).

**Decision.** Birth date **required**, minimum age **18** (`MIN_SIGNUP_AGE` in
`common/birth-date.schema.ts`). Specs §2.1 and §8 aligned.

---

## ADR-010 — Account status as an enum (not two booleans)

**Context.** Spec §8 modeled `email_verified` + `account_locked` (two bools).

**Decision.** One `status` enum: `pending_verification | active | blocked`. The
"email verified" fact becomes `email_verified_at` (timestamp) on the entity;
`active` only after Terms acceptance (spec §2.3). Spec §8 updated, plus a
`terms_acceptances` table (LGPD proof).

---

## ADR-011 — Transactional email: SMTP via nodemailer, Mailpit locally

**Context.** Signup (spec §2/§3) must email the verification code. "Mailjet" was
floated — but it's a SaaS provider, it doesn't run in a container.

**Decision.** A thin `MailerService` over **nodemailer**, transport configured
from env (`MAIL_*`). Local: a **Mailpit** container (`axllent/mailpit`) in
docker-compose — SMTP on `:1025`, UI on `:8025`, no auth. Staging/prod: point
`MAIL_*` at a real SMTP (Mailjet: `in-v3.mailjet.com:587`, API key/secret as
user/pass). No code change between environments.

A send failure in `register` does **not** fail the request (there's a "resend");
it just logs a `warn`.

**Consequences.** `MailModule` exports `MailerService`; `AuthModule` imports it.
Message composition uses `@org/i18n` keys inside `MailerService`
(`sendVerificationCode`), not `AuthService`.

---

## ADR-012 — `@org/utils`: pure helpers, separate from contracts

**Context.** `maskEmail` lived inside `@org/contracts` — but it's not a schema
(it's string→string), and the folder grouped by file type, not by domain.

**Decision.** Two packages with distinct responsibilities (Nx `type:util` pattern
+ create-t3-turbo, which separates `packages/validators` from utilities):

- **`@org/contracts`** — Zod schemas + inferred types only, grouped by domain
  (`common/`, `auth/`, `user/`).
- **`@org/utils`** — pure TS functions, **no framework, no Zod**, grouped by
  subject (`email/`, …). First resident: `maskEmail`. It will grow (date
  formatting, the club's `R$ 20.00` fee, etc.).

**Consequences.** Both framework-free and consumable by api/web/mobile. Rule:
needs Zod → `@org/contracts`; pure helper → `@org/utils`; depends on a framework
→ stays in the app.

---

## ADR-013 — i18n: message keys + per-locale catalog

**Context.** The product will be externalized, so user-facing text can't be
hardcoded in one language.

**Decision.** Code and schemas emit **keys**, never prose; translation happens at
the edge, per locale.

- **`@org/i18n`** (new, framework-free): flat catalogs (`en`, `pt-BR`),
  `t(key, locale, params?)`, `parseAcceptLanguage(header)`, and
  `translateZodError(error, locale)` (structural — no `zod` dependency).
- **`@org/contracts`** carries no text: schema messages are keys
  (`.min(8, 'validation.password.minLength')`); issues without a custom message
  are mapped from their Zod `code` by `translateZodError`.
- **API**: `AllExceptionsFilter` resolves the locale from `Accept-Language` and
  localizes everything — `ZodError` → 422 with translated field issues,
  `AppException` (carries a key + params) → its status with a translated message
  and a machine `code`.
- **Web/mobile**: consume the same `@org/i18n` catalog (or merge it into
  i18next/react-i18next for their own UI copy).

Base locale `en`, second `pt-BR`. A catalog-parity test keeps them in sync.
`nestjs-i18n` was rejected — API-only, doesn't help web/mobile share.

**Consequences.** Adding a language = one catalog file. Every user-facing string
flows through a key; `errors.internal` / `errors.validationFailed` cover the
generic cases. Dev-only boot errors (bad env vars) stay plain English.

---

## Known gaps

- **`nx test contracts` / `nx test i18n` / `nx test utils`** fail
  (`Vitest failed to find the current suite`) — a vitest 4 bug with the root
  `vitest.config.mts` that uses `test.projects`. `npx vitest run` inside each
  package works. Does not block build/typecheck.
- **Email**: channel ready (ADR-011). Only the **real 2-minute cooldown** on
  `resendCode` is missing (it currently re-issues without checking the interval).
- **Refresh/logout/password reset**: repositories ready, routes not yet.
- **`clubs` in the JWT**: currently `[]` — the clubs domain doesn't exist yet.
- **Duplicate email on register**: currently an explicit `409`; consider a silent
  anti-enumeration response.
