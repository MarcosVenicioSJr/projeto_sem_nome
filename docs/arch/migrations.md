# Database Migrations — Atlas

> Decision: [ADR-015](./decisions.md#adr-015--atlas-for-schema-migrations).
> Tool: [Atlas](https://atlasgo.io) (`atlas` Go binary) + `@ariga/atlas-provider-typeorm`.

## Model

```
TypeORM entities            Atlas                         Postgres
(desired schema)   ── diff ──►  migrations/*.sql   ── apply ──►  atlas_schema_revisions
src/app/database/entities/     src/app/database/migrations/       (applied history)
```

- **Entities are the desired schema.** Atlas loads them via the provider and
  computes the SQL diff — the thing `typeorm migration:generate` never did well
  (native enums, defaults, `timestamptz`).
- **`migrations/*.sql` + `atlas.sum`** are the versioned history, committed to git.
  Never edit a committed `.sql` — it breaks the `atlas.sum` checksum.
- **TypeORM never touches the schema.** `synchronize: false`, hardcoded in
  `DatabaseModule`. There is no `DB_SYNCHRONIZE` env var.
- **Entities do not import `@org/contracts`** (ADR-015) so the provider can load
  them standalone. Enum values live locally in the entity; drift against the
  contract is caught at compile time in `user.mapper.ts`.

## One-time setup

Install the Atlas CLI (the npm provider is already a dev dependency):

- Windows: `winget install ariga.atlas` (or `scoop install atlas`, or the
  `.exe` from `https://release.ariga.io/atlas/atlas-windows-amd64-latest.exe`)
- macOS/Linux: `curl -sSf https://atlasgo.sh | sh`
- Docker must be running (Atlas spins up an ephemeral Postgres to plan the diff).

Config lives in [`apps/scheduling-api/atlas.hcl`](../../apps/scheduling-api/atlas.hcl).
The desired schema is produced by `atlas-load.mjs` next to it — the TypeORM
provider, with `uuid_generate_v4()` rewritten to `gen_random_uuid()` (PG 13+
core, so no `uuid-ossp` extension is needed anywhere).

## Day-to-day

All commands are Nx targets that load the root `.env` first (via `dotenv-cli`)
and `cd` into `apps/scheduling-api`.

```bash
# 1. change an entity (or the Zod schema it mirrors)

# 2. generate the migration
npx nx run scheduling-api:migrate-diff -- add_user_locale
#    -> src/app/database/migrations/2026...._add_user_locale.sql  (+ atlas.sum)

# 3. review the SQL, commit it together with the entity change

# 4. apply to your local DB
npx nx run scheduling-api:migrate-apply

# other
npx nx run scheduling-api:migrate-status     # what's pending
```

If `atlas.sum` ever goes out of sync (a merge, a hand-edit you actually meant),
recompute it once with the raw CLI — it's not a routine step, so there's no Nx
target for it:

```bash
cd apps/scheduling-api && atlas migrate hash --env local
```

`atlas migrate lint` (destructive-op / lock analysis) moved to Atlas Pro in
v0.38, so there is **no `migrate-lint` target** — the safety gate is reviewing
the generated `.sql` in the PR. Everything used here (`diff`, `apply`, `status`,
`hash`) is Community Edition.

The first run generates the initial migration from the current entities.

## CI / deploy

The `integration` job in [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)
(a non-distributed `ubuntu-latest` job — it has Docker for the ephemeral dev DB
and the compose stack; also runs the e2e suite):

- `ariga/setup-atlas@v0` installs the CLI.
- **drift check** — runs `migrate-diff` and fails if it produced a new `.sql`
  (i.e. an entity changed without a matching migration). Community Edition.

**Deploy:** run `nx run scheduling-api:migrate-apply` (pointed at the target DB
via `DB_*` env) **before** starting the API. Atlas has no Node runtime library,
so the app does not self-migrate.

## Gotchas

- `migrate diff` needs Docker up (the ephemeral dev database). `migrate apply`
  needs the target DB reachable (`docker compose up -d`).
- Never hand-edit a committed `.sql`; add a new migration instead.
- Primary keys default to `gen_random_uuid()` (see `atlas-load.mjs`). If you
  reintroduce `uuid_generate_v4()`, the migration will fail on a fresh DB unless
  `CREATE EXTENSION "uuid-ossp"` ships as its own baseline migration.
- If someone ran an old build with `synchronize` on, use
  `atlas schema diff` between the entities and the live DB to see the drift.
