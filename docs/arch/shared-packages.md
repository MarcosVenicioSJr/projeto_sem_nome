# Consuming the Shared Packages (`@org/*`)

> Decisions: [ADR-002](./decisions.md#adr-002--orgcontracts-shared-contracts-in-zod),
> [ADR-012](./decisions.md#adr-012--orgutils-pure-helpers-separate-from-contracts),
> [ADR-013](./decisions.md#adr-013--i18n-message-keys--per-locale-catalog),
> [ADR-014](./decisions.md#adr-014--source-vs-built-resolution-for-web--mobile) (mobile app has since been removed; the split still applies to web).

Three framework-free packages are shared by the API and web. **Do not
fork their logic into an app.**

| Package | Holds | Import example |
|---|---|---|
| `@org/contracts` | Zod schemas + `z.infer` types, grouped by domain (`common/`, `auth/`, `user/`) | `import { registerSchema, type RegisterInput } from '@org/contracts'` |
| `@org/utils` | pure TS helpers, **no framework, no Zod** | `import { maskEmail } from '@org/utils'` |
| `@org/i18n` | message catalogs + `t()`, `translateZodError()`, `parseAcceptLanguage()` | `import { t } from '@org/i18n'` |

**Where does new shared code go?**

- Needs Zod (a schema / a validation rule) → `@org/contracts`.
- Pure function (string/date/number, no dependencies) → `@org/utils`.
- User-facing text → **never** a literal in code; add a key to `@org/i18n`
  catalogs and emit the key.
- Depends on a framework (`@nestjs/*`, `react`, an ORM) → it stays in the app.

---

## Adding one of them to an app

```bash
npm pkg set dependencies.@org/contracts="*" dependencies.@org/i18n="*" \
             dependencies.zod="^4.1.11" \
             -w @org/scheduling-web
npm install
npx nx sync                                # updates tsconfig references
```

Types work immediately: every app extends `tsconfig.base.json`, which carries
`customConditions: ["@org/source"]`, so the TS server resolves `@org/*` to the
`.ts` source.

---

## The one gotcha: source vs. built output

| Consumer | Resolves `@org/*` to | Why |
|---|---|---|
| `scheduling-api` | **source `.ts`** | webpack + `NxAppWebpackPlugin` honors the `@org/source` export condition from `tsconfig` |
| `scheduling-web` | **built `dist/`** (default) | Next falls back to the package's `main`/`module` field |

Consequences:

- **`nx build scheduling-web` is fine as-is** — Nx builds
  `contracts` / `utils` / `i18n` first (implicit dependency).
- **Dev with hot-reload** (`nx dev`): the `dist/` can go stale after you
  edit a schema. Pick one:

  1. Rebuild the packages on change, in a side terminal:
     ```bash
     npx nx watch -p contracts utils i18n -- nx build contracts utils i18n
     ```
  2. Or point the bundler at the source (package becomes "live"):

     **Next** — `apps/scheduling-web/next.config.js`:
     ```js
     const nextConfig = {
       transpilePackages: ['@org/contracts', '@org/utils', '@org/i18n'],
       webpack: (config) => {
         config.resolve.conditionNames = ['@org/source', 'import', 'require', 'default'];
         return config;
       },
     };
     ```

---

## Standard usage

### Forms (web uses react-hook-form)

```tsx
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterInput } from '@org/contracts';
import { t } from '@org/i18n';

const { register, handleSubmit, formState: { errors } } =
  useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

// issue messages are i18n KEYS — resolve them at render time
<span>{errors.password && t(errors.password.message!, locale)}</span>
```

The signup wizard = one schema per step: `registerSchema`, `verifyEmailSchema`,
`acceptTermsSchema`, `updatePreferencesSchema`.

### Genre chips

```tsx
import { GENRES, genreLabelKey } from '@org/contracts';
GENRES.map((g) => <Chip key={g} label={t(genreLabelKey(g), locale)} />);
```

### Validate an API response against the same contract (optional)

```ts
import { userSchema } from '@org/contracts';
const me = userSchema.parse(await res.json());
```

### Locale

Pick `locale` once (device setting / `navigator.language`), pass it to every
`t(...)` call. The API does the same server-side from `Accept-Language`.

---

## Rules (don't break the pattern)

- **One `zod` version** across the monorepo (`^4.1.11`). A different major
  desyncs `z.infer` types from runtime.
- **`createZodDto` is API-only** (Nest DI plumbing). On the front, import the raw
  schema.
- **No `class-validator` / decorator DTOs** on the front — the Zod schema *is*
  the validation.
- **No literal user-facing strings** in code — add a key to `@org/i18n`.
- **Never** add `@nestjs/*` / `react` / ORM imports to `@org/contracts`,
  `@org/utils` or `@org/i18n`. If you need that, the code belongs in an app.
- After changing dependencies between projects, run `npx nx sync`.
