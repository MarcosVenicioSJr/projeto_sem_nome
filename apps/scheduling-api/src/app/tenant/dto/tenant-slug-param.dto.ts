import { tenantSlugParamSchema } from '@org/contracts';
import { createZodDto } from '../../common/zod.dto';

/** `:slug` route param of `/t/:slug/...`. */
export class TenantSlugParamDto extends createZodDto(tenantSlugParamSchema) {}
