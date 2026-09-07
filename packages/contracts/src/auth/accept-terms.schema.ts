import { z } from 'zod';

/**
 * STEP 3 - "Terms and privacy".
 * `termsVersion` is the version the screen showed (e.g. "2026-01-01"); the app
 * echoes it back so the server records exactly what was accepted.
 *
 * `consentRecommendations` / `consentMarketing` are GRANULAR LGPD consents
 * (LGPD doc §3): opt-in, default `false`, NEVER pre-checked on screen, and
 * refusing them must NOT block signup or app usage. They are kept separate
 * from the Terms acceptance on purpose.
 */
export const acceptTermsSchema = z.object({
  registrationId: z.uuid(),
  termsVersion: z.string().min(1, 'validation.field.required'),
  acceptedTerms: z
    .boolean()
    .refine((v) => v === true, 'validation.terms.required'),
  consentRecommendations: z.boolean().default(false),
  consentMarketing: z.boolean().default(false),
});
export type AcceptTermsInput = z.infer<typeof acceptTermsSchema>;
