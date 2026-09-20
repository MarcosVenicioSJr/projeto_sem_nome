import { verifyEmailSchema, resendCodeSchema } from '@org/contracts';
import { createZodDto } from '../../common/zod.dto';

/** Step 2 - POST /auth/verify-email body. */
export class VerifyEmailDto extends createZodDto(verifyEmailSchema) {}

/** POST /auth/resend-code. */
export class ResendCodeDto extends createZodDto(resendCodeSchema) {}
