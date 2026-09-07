import { updateProfileSchema } from '@org/contracts';
import { createZodDto } from '../common/zod.dto';

// API-side classes only. Shape + rules live in @org/contracts.
export class UpdateProfileDto extends createZodDto(updateProfileSchema) {}

export { UpdatePreferencesDto } from './dto/update-preferences.dto';
