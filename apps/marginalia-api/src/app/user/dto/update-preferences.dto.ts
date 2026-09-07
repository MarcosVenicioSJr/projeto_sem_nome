import { updatePreferencesSchema } from '@org/contracts';
import { createZodDto } from '../../common/zod.dto';

/** Step 4 - PUT /users/me/preferences body. */
export class UpdatePreferencesDto extends createZodDto(updatePreferencesSchema) {}
