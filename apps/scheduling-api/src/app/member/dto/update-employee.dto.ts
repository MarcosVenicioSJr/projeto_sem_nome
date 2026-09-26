import { updateEmployeeSchema } from '@org/contracts';
import { createZodDto } from '../../common/zod.dto';

/** PATCH /members/employees/:id body. */
export class UpdateEmployeeDto extends createZodDto(updateEmployeeSchema) {}
