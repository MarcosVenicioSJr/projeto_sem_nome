import { z } from 'zod';

export const MIN_SIGNUP_AGE = 18;

/**
 * "Birth date" field (step 1). Required, minimum age 18
 * (LGPD doc: art. 14 + the club's recurring charge).
 * The contract carries ISO `YYYY-MM-DD`; the dd/mm/yyyy mask on screen is UI only.
 */
export const birthDateSchema = z.iso
  .date()
  .refine((iso) => new Date(iso) <= new Date(), 'validation.birthDate.future')
  .refine((iso) => {
    const cutoff = new Date();
    cutoff.setFullYear(cutoff.getFullYear() - MIN_SIGNUP_AGE);
    return new Date(iso) <= cutoff;
  }, 'validation.birthDate.minAge');

export type BirthDate = z.infer<typeof birthDateSchema>;
