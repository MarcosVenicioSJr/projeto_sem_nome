import { createTenantSchema } from '@org/contracts';
import { createZodDto } from '../../common/zod.dto';

/** POST /tenants body. */
export class CreateTenantDto extends createZodDto(createTenantSchema) {}
