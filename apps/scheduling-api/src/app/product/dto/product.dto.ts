import {
  createProductSchema,
  idParamSchema,
  updateProductSchema,
} from '@org/contracts';
import { createZodDto } from '../../common/zod.dto';

export class CreateProductDto extends createZodDto(createProductSchema) {}
export class UpdateProductDto extends createZodDto(updateProductSchema) {}
export class IdParamDto extends createZodDto(idParamSchema) {}
