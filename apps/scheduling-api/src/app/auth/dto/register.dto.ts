import { registerSchema, usernameAvailableQuerySchema } from '@org/contracts';
import { createZodDto } from '../../common/zod.dto';

/** Step 1 - POST /auth/register body. */
export class RegisterDto extends createZodDto(registerSchema) {}

/** GET /auth/username-available?u=... */
export class UsernameAvailableQueryDto extends createZodDto(
  usernameAvailableQuerySchema,
) {}
