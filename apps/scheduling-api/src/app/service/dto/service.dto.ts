import {
  createServiceSchema,
  idParamSchema,
  professionalParamSchema,
  professionalServiceParamSchema,
  updateServiceSchema,
  upsertProfessionalServiceSchema,
} from '@org/contracts';
import { createZodDto } from '../../common/zod.dto';

export class CreateServiceDto extends createZodDto(createServiceSchema) {}
export class UpdateServiceDto extends createZodDto(updateServiceSchema) {}
export class IdParamDto extends createZodDto(idParamSchema) {}
export class ProfessionalParamDto extends createZodDto(professionalParamSchema) {}
export class ProfessionalServiceParamDto extends createZodDto(
  professionalServiceParamSchema,
) {}
export class UpsertProfessionalServiceDto extends createZodDto(
  upsertProfessionalServiceSchema,
) {}
