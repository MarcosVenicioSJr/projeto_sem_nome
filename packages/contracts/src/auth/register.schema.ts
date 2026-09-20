import { z } from 'zod';
import { emailSchema, passwordSchema, phoneSchema } from '../common/index.js';
import { nameSchema } from '../user/user.schema.js';

/**
 * Client signup — POST /auth/client/register. Creates a global `client`
 * account; owners are created through tenant onboarding (POST /tenants).
 */
export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
});
export type RegisterInput = z.infer<typeof registerSchema>;
