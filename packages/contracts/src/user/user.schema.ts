import { z } from 'zod';
import {
  usernameSchema,
  emailSchema,
  birthDateSchema,
  genreSchema,
} from '../common/index.js';

/**
 * The user shape as the API RETURNS it to the client (output).
 * No password. No persistence yet: the fields below are the contract,
 * not a table mapping.
 */

export const accountStatusSchema = z.enum([
  'pending_verification', // account created, email not confirmed yet (step 2)
  'active', // terms accepted (step 3) -> can use the app
  'blocked', // 3 failed logins
]);
export type AccountStatus = z.infer<typeof accountStatusSchema>;

export const userSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  username: usernameSchema,
  email: emailSchema,
  birthDate: birthDateSchema,
  favoriteGenres: z.array(genreSchema),
  status: accountStatusSchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type User = z.infer<typeof userSchema>;

/** What other club members see (no email / birth date). */
export const publicProfileSchema = userSchema.pick({
  id: true,
  name: true,
  username: true,
  favoriteGenres: true,
});
export type PublicProfile = z.infer<typeof publicProfileSchema>;

/** Profile edit after signup (PATCH /users/me). No defaults. */
export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2, 'validation.name.tooShort').max(120, 'validation.string.tooLong'),
    birthDate: birthDateSchema,
  })
  .partial();
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/** Route param. */
export const userIdParamSchema = z.object({ id: z.uuid() });
export type UserIdParam = z.infer<typeof userIdParamSchema>;
