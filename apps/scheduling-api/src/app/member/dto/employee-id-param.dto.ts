import { employeeIdParamSchema } from '@org/contracts';
import { createZodDto } from '../../common/zod.dto';

/** `:id` route param of `/members/employees/:id`. */
export class EmployeeIdParamDto extends createZodDto(employeeIdParamSchema) {}
