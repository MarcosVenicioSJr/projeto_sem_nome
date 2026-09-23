# Persistence — TypeORM + Repository Pattern

> Decision: [ADR-006](./decisions.md#adr-006--persistence-typeorm--repository-pattern).
> Stack: TypeORM 0.3 + `@nestjs/typeorm` + Postgres 16.

## Structure

```
apps/scheduling-api/src/app/database/
  database.module.ts        forRootAsync (connection) + forFeature + providers/exports
  enums/
    account-status.enum.ts        ACCOUNT_STATUS / AccountStatus
    verification-purpose.enum.ts   VERIFICATION_PURPOSE / VerificationPurpose
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
  migrations/               Atlas *.sql + atlas.sum (see migrations.md)
apps/scheduling-api/atlas.hcl       Atlas config
apps/scheduling-api/atlas-load.mjs  provider wrapper (uuid rewrite)
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

**Why:** upgrading the ORM touches only `database/`; services are testable with a
repository mock (see `auth.service.spec.ts`); queries get names.

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

## Schema changes = migrations (Atlas)

`synchronize` is **always `false`**. The schema is managed by **Atlas**
([ADR-015](./decisions.md#adr-015--atlas-for-schema-migrations)): edit an entity,
then `nx run scheduling-api:migrate-diff -- <name>` to generate a `.sql`
migration, `migrate-apply` to run it. Full workflow in
[migrations.md](./migrations.md).

## Entity conventions

- Column names in `snake_case` (`@Column({ name: 'password_hash' })`), class in
  `camelCase`.
- Timestamps `timestamptz`; `@CreateDateColumn` / `@UpdateDateColumn`.
- `id` is always `uuid` (`@PrimaryGeneratedColumn('uuid')`).
- Secrets (password, OTP code, refresh token) never in plain text — hash only.
- **Entities do not import `@org/contracts`** — the Atlas provider loads them
  standalone. Enum values are local `as const` tuples in `database/enums/`; drift
  against the contract's Zod enum is caught at compile time in `*.mapper.ts`
  (the mapper assigns `entity.status` to the contract's `User['status']`).
