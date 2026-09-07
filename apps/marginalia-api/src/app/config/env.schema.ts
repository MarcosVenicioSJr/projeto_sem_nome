import { z } from 'zod';

/** `"true"` / `"false"` env value -> boolean; absent -> `def`. */
const boolFromEnv = (def: boolean) =>
  z
    .enum(['true', 'false'])
    .default(String(def) as 'true' | 'false')
    .transform((v) => v === 'true');

/**
 * Contract for the marginalia-api environment variables. The ONLY entry
 * point to `process.env` — nothing else in the code reads it directly.
 * Validated at boot by ConfigModule; if anything is wrong, the app won't start.
 */
export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3000),

  // Session (Security spec §6). TTLs are fixed by the spec (15m / 5h) in
  // auth/jwt/jwt.config.ts — only the secret is configurable.
  JWT_SECRET: z
    .string()
    .min(16, 'JWT_SECRET must be at least 16 characters'),

  // Database (Postgres via docker-compose)
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().int().positive().default(5432),
  DB_USER: z.string().default('marginalia'),
  DB_PASSWORD: z.string().default('marginalia'),
  DB_NAME: z.string().default('marginalia'),
  DB_LOGGING: boolFromEnv(false),

  // Email (SMTP). Local: Mailpit (docker-compose). Prod: a real SMTP (e.g. Mailjet).
  MAIL_HOST: z.string().default('localhost'),
  MAIL_PORT: z.coerce.number().int().positive().default(1025),
  MAIL_SECURE: boolFromEnv(false),
  MAIL_USER: z.string().default(''),
  MAIL_PASSWORD: z.string().default(''),
  MAIL_FROM: z.string().default('Marginália <no-reply@marginalia.local>'),
});

export type Env = z.infer<typeof envSchema>;

/** Passed to `ConfigModule.forRoot({ validate })`. */
export function validateEnv(raw: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment variables:\n${issues}`);
  }
  return parsed.data;
}
