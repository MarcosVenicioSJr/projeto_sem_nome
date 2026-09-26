import {
  agendaQuerySchema,
  cancelTokenParamSchema,
  createAppointmentSchema,
  createTimeOffSchema,
  idParamSchema,
  markDoneSchema,
  professionalParamSchema,
  setScheduleSchema,
  slotsQuerySchema,
} from '@org/contracts';
import { z } from 'zod';
import { createZodDto } from '../../common/zod.dto';

export class CreateAppointmentDto extends createZodDto(createAppointmentSchema) {}
export class SlotsQueryDto extends createZodDto(slotsQuerySchema) {}
export class AgendaQueryDto extends createZodDto(agendaQuerySchema) {}
export class MarkDoneDto extends createZodDto(markDoneSchema) {}
export class CancelTokenParamDto extends createZodDto(cancelTokenParamSchema) {}
export class IdParamDto extends createZodDto(idParamSchema) {}
export class ProfessionalParamDto extends createZodDto(professionalParamSchema) {}
export class SetScheduleDto extends createZodDto(setScheduleSchema) {}
export class CreateTimeOffDto extends createZodDto(createTimeOffSchema) {}
export class TimeOffParamDto extends createZodDto(
  z.object({ professionalId: z.uuid(), id: z.uuid() }),
) {}
