import {
  commissionsQuerySchema,
  createExpenseSchema,
  idParamSchema,
  monthlyReportQuerySchema,
  updateExpenseSchema,
} from '@org/contracts';
import { createZodDto } from '../../common/zod.dto';

export class CreateExpenseDto extends createZodDto(createExpenseSchema) {}
export class UpdateExpenseDto extends createZodDto(updateExpenseSchema) {}
export class CommissionsQueryDto extends createZodDto(commissionsQuerySchema) {}
export class MonthlyReportQueryDto extends createZodDto(
  monthlyReportQuerySchema,
) {}
export class IdParamDto extends createZodDto(idParamSchema) {}
