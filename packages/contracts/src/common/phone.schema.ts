import { z } from 'zod';

/** Brazilian phone with area code, digits only (e.g. 11987654321). */
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\d{11}$/, 'validation.phone.format');

export type Phone = z.infer<typeof phoneSchema>;
