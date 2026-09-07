import { acceptTermsSchema } from '@org/contracts';
import { createZodDto } from '../../common/zod.dto';

/** Step 3 - POST /auth/accept-terms body. */
export class AcceptTermsDto extends createZodDto(acceptTermsSchema) {}
