import { z } from 'zod';

export const USERNAME_MIN = 4;
export const USERNAME_MAX = 20;

/**
 * "Username" field (step 1) — rules from the Security spec §2.2:
 * 4–20 chars; letters, digits, `.` and `_`; starts with a letter; no `..`
 * and no trailing `.`; no spaces/accents. Normalized to lowercase.
 * Availability ("helenacardoso ✓ Available") is an async server check,
 * NOT part of the schema.
 */
export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(USERNAME_MIN, 'validation.string.tooShort')
  .max(USERNAME_MAX, 'validation.string.tooLong')
  .regex(/^[a-z](?:[a-z0-9_]|\.(?=[a-z0-9_]))*$/, 'validation.username.pattern');

export type Username = z.infer<typeof usernameSchema>;
