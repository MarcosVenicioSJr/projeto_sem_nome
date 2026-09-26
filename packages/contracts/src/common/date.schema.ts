import { z } from 'zod';

/** Calendar day, `YYYY-MM-DD`. */
export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'validation.date.format');
export type IsoDate = z.infer<typeof isoDateSchema>;

/** Calendar month, `YYYY-MM`. */
export const monthSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'validation.month.format');
export type Month = z.infer<typeof monthSchema>;

/** Minutes since 00:00 of a day (0–1440). */
export const minuteOfDaySchema = z
  .number()
  .int('validation.number.invalid')
  .min(0, 'validation.number.invalid')
  .max(1440, 'validation.number.invalid');

/** Money amount in BRL (two decimals at most is enforced by storage). */
export const moneySchema = z.number().min(0, 'validation.number.invalid');

/** Route param `/:id`. */
export const idParamSchema = z.object({ id: z.uuid() });
export type IdParam = z.infer<typeof idParamSchema>;
