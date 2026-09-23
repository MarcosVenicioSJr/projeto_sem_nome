import { registerSchema } from '@org/contracts';
import { createZodDto } from '../../common/zod.dto';

/** POST /t/:slug/auth/register body. */
export class RegisterDto extends createZodDto(registerSchema) {}
