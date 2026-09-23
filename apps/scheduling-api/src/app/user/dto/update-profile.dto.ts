import { updateProfileSchema } from '@org/contracts';
import { createZodDto } from '../../common/zod.dto';

/** PATCH /user/me body. */
export class UpdateProfileDto extends createZodDto(updateProfileSchema) {}
