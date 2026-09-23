import { createEmployeeSchema } from '@org/contracts';
import { createZodDto } from '../../common/zod.dto';

/** POST /members/employees body. */
export class CreateEmployeeDto extends createZodDto(createEmployeeSchema) {}
