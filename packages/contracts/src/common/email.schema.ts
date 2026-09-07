import { z } from 'zod';

/** "Email" field (step 1). Normalized before validation so it matches the confirmation. */
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email('validation.format.email'));

export type Email = z.infer<typeof emailSchema>;
