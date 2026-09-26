import {
  adjustQuantitySchema,
  createStockItemSchema,
  idParamSchema,
  updateStockItemSchema,
} from '@org/contracts';
import { createZodDto } from '../../common/zod.dto';

export class CreateStockItemDto extends createZodDto(createStockItemSchema) {}
export class UpdateStockItemDto extends createZodDto(updateStockItemSchema) {}
export class AdjustQuantityDto extends createZodDto(adjustQuantitySchema) {}
export class IdParamDto extends createZodDto(idParamSchema) {}
