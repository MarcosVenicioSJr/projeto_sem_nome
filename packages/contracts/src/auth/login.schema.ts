import { z } from 'zod';
import { emailSchema } from '../common/index.js';

/**
 * POST /auth/client/login and POST /auth/member/login (owner or employee).
 * Login does NOT re-apply `passwordSchema`: strength rules only apply at
 * signup — here "non-empty" is enough, otherwise you'd lock out old accounts
 * and leak the password policy. The error is generic on purpose.
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'validation.field.required'),
});
export type LoginInput = z.infer<typeof loginSchema>;
