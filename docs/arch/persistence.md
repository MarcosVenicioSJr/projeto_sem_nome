# Persistence — TypeORM + Repository Pattern

> Decision: [ADR-006](./decisions.md#adr-006--persistence-typeorm--repository-pattern).
> Stack: TypeORM 0.3 + `@nestjs/typeorm` + Postgres 16.

## Structure

```
apps/marginalia-api/src/app/database/
  database.module.ts        forRootAsync (connection) + forFeature + providers/exports
  entities/
    user.entity.ts               users table
    verification-code.entity.ts  verification_codes table
    refresh-token.entity.ts      refresh_tokens table
    terms-acceptance.entity.ts   terms_acceptances table
  repositories/
    users.repository.ts
    verification-codes.repository.ts
    refresh-tokens.repository.ts
    terms-acceptances.repository.ts
  migrations/               (empty for now — see "Migrations")
apps/marginalia-api/data-source.ts   DataSource for the migrations CLI only
```

Tables follow Security spec §8 (with the ADR-009/010 adjustments).

## The pattern

Services do **not** inject TypeORM's `Repository<Entity>`. Each aggregate has a
domain repository class:

```ts
@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(UserEntity) private readonly repo: Repository<UserEntity>,
  ) {}

  existsByUsername(username: string) { return this.repo.existsBy({ username }); }
  create(data: Partial<UserEntity>) { return this.repo.save(this.repo.create(data)); }
  // ...
}
```

The service speaks the domain language and doesn't know TypeORM exists:

```ts
if (await this.users.existsByUsername(input.username)) {
  throw new AppException('errors.auth.usernameTaken', HttpStatus.CONFLICT);
}
```

**Why:** swapping/upgrading the ORM touches only `database/`; services are
testable with a repository mock (see `auth.service.spec.ts`); queries get names.

## Wiring

`DatabaseModule` does it all in one place — opens the connection and exports the
repositories:

```ts
TypeOrmModule.forRootAsync({ inject: [ConfigService], useFactory: (c) => ({
  type: 'postgres',
  host: c.get('DB_HOST', { infer: true }), /* ...DB_* */
  entities: ENTITIES,
  synchronize: c.get('DB_SYNCHRONIZE', { infer: true }), // dev only
})}),
TypeOrmModule.forFeature(ENTITIES),
```

`AuthModule` and `UserModule` just do `imports: [DatabaseModule]` and inject the
repositories. No circular dependency (`DatabaseModule` knows nobody).

## `synchronize` vs migrations

- **Dev:** `DB_SYNCHRONIZE=true` — TypeORM creates/alters the tables from the
  entities on every boot. Fast to iterate while the schema changes.
- **Production / once stable:** `DB_SYNCHRONIZE=false` + versioned migrations.
  `data-source.ts` is already configured:

```bash
# with Postgres up (docker compose up -d), from the repo root:
npx typeorm-ts-node-commonjs migration:generate \
  apps/marginalia-api/src/app/database/migrations/Init \
  -d apps/marginalia-api/data-source.ts

npx typeorm-ts-node-commonjs migration:run    -d apps/marginalia-api/data-source.ts
npx typeorm-ts-node-commonjs migration:revert -d apps/marginalia-api/data-source.ts
```

Then register `migrations` + `migrationsRun` in `DatabaseModule`.

## Entity conventions

- Column names in `snake_case` (`@Column({ name: 'password_hash' })`), class in
  `camelCase`.
- Timestamps `timestamptz`; `@CreateDateColumn` / `@UpdateDateColumn`.
- Domain enums come from `@org/contracts` (`accountStatusSchema.options`) to avoid
  duplicating the list.
- `id` is always `uuid` (`@PrimaryGeneratedColumn('uuid')`).
- Secrets (password, OTP code, refresh token) never in plain text — hash only.
