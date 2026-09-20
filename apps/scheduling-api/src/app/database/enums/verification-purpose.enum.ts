/** Why a verification code was issued (Security spec §3). */
export const VERIFICATION_PURPOSE = ['registration', 'password_reset'] as const;

export type VerificationPurpose = (typeof VERIFICATION_PURPOSE)[number];
