import { loginSchema } from '@org/contracts';
import { createZodDto } from '../../common/zod.dto';

/** "Sign in" screen - POST /auth/login body. */
export class LoginDto extends createZodDto(loginSchema) {}
