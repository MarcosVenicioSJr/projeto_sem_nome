import { z } from 'zod';

export const OTP_LENGTH = 6;

/** Email confirmation code (step 2) — 6 digits. */
export const otpCodeSchema = z
  .string()
  .trim()
  .regex(new RegExp(`^\\d{${OTP_LENGTH}}$`), 'validation.otp.length');

export type OtpCode = z.infer<typeof otpCodeSchema>;
