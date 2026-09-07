import { z } from 'zod';
import {
  usernameSchema,
  emailSchema,
  passwordSchema,
  birthDateSchema,
} from '../common/index.js';

/**
 * STEP 1 - "Create your account".
 * The same schema is used to (a) validate the form before enabling "Continue"
 * and (b) as the POST /auth/register body.
 */
export const registerSchema = z.object({
  name: z.string().trim().min(2, 'validation.name.tooShort').max(120, 'validation.string.tooLong'),
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
  birthDate: birthDateSchema,
});
export type RegisterInput = z.infer<typeof registerSchema>;

/** Username availability check (GET /auth/username-available?u=). */
export const usernameAvailableQuerySchema = z.object({ u: usernameSchema });
export type UsernameAvailableQuery = z.infer<typeof usernameAvailableQuerySchema>;
