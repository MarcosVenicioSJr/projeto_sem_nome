import { z } from 'zod';
import { otpCodeSchema } from '../common/index.js';

/**
 * STEP 2 - "Confirm your email".
 * `registrationId` comes back from POST /auth/register (the account is still
 * pending). The counter / "3 attempts" / expiry are server state — the
 * contract only carries the typed code.
 */
export const verifyEmailSchema = z.object({
  registrationId: z.uuid(),
  code: otpCodeSchema,
});
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

/** "Resend" the code (POST /auth/resend-code). */
export const resendCodeSchema = z.object({ registrationId: z.uuid() });
export type ResendCodeInput = z.infer<typeof resendCodeSchema>;
