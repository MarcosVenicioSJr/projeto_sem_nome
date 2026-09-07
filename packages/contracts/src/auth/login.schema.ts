import { z } from 'zod';

/**
 * "Sign in to Marginália" screen.
 * Note: login does NOT re-apply `usernameSchema` / `passwordSchema`. Format /
 * strength rules only apply at signup — here "non-empty" is enough, otherwise
 * you'd lock out old accounts and leak the password policy.
 * The error is generic on purpose (never says which field was wrong); the
 * lock after 3 attempts is server state.
 */
export const loginSchema = z.object({
  username: z.string().trim().min(1, 'validation.field.required'),
  password: z.string().min(1, 'validation.field.required'),
});
export type LoginInput = z.infer<typeof loginSchema>;
