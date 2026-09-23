import { loginSchema } from '@org/contracts';
import { createZodDto } from '../../common/zod.dto';

/** POST /t/:slug/auth/login body. */
export class LoginDto extends createZodDto(loginSchema) {}
