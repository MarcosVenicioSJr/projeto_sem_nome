import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { AccessTokenPayload } from '@org/contracts';
import { CurrentUser, JwtAuthGuard, RolesGuard } from '../auth/jwt';
import { TenantSlugParamDto } from '../tenant/dto/tenant-slug-param.dto';
import { AgendaService } from './agenda.service';
import {
  AgendaQueryDto,
  CancelTokenParamDto,
  CreateAppointmentDto,
  CreateTimeOffDto,
  IdParamDto,
  MarkDoneDto,
  ProfessionalParamDto,
  SetScheduleDto,
  SlotsQueryDto,
  TimeOffParamDto,
} from './dto/agenda.dto';

/**
 * Public booking flow. No login: the end customer only gives a name and a
 * phone, and gets back a secret link to cancel.
 */
@Controller()
export class PublicAgendaController {
  constructor(private readonly agenda: AgendaService) {}

  @Get('t/:slug/agenda/professionals')
  professionals(@Param() { slug }: TenantSlugParamDto) {
    return this.agenda.listProfessionals(slug);
  }

  @Get('t/:slug/agenda/slots')
  slots(@Param() { slug }: TenantSlugParamDto, @Query() query: SlotsQueryDto) {
    return this.agenda.slots(slug, query);
  }

  @Post('t/:slug/agenda/appointments')
  book(
    @Param() { slug }: TenantSlugParamDto,
    @Body() dto: CreateAppointmentDto,
  ) {
    return this.agenda.book(slug, dto);
  }

  @Post('agenda/cancel/:token')
  @HttpCode(200)
  cancel(@Param() { token }: CancelTokenParamDto) {
    return this.agenda.cancelByToken(token);
  }
}

/**
 * Staff agenda. Owner/manager see every professional; an employee only their
 * own bookings (enforced in the service).
 */
@Controller('agenda')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AgendaController {
  constructor(private readonly agenda: AgendaService) {}

  @Get()
  day(
    @CurrentUser() caller: AccessTokenPayload,
    @Query() query: AgendaQueryDto,
  ) {
    return this.agenda.listDay(caller, query);
  }

  /** Free times for the counter (no 1 h notice). */
  @Get('slots')
  slots(
    @CurrentUser() caller: AccessTokenPayload,
    @Query() query: SlotsQueryDto,
  ) {
    return this.agenda.staffSlots(caller, query);
  }

  /** Booking made at the counter. */
  @Post('appointments')
  book(
    @CurrentUser() caller: AccessTokenPayload,
    @Body() dto: CreateAppointmentDto,
  ) {
    return this.agenda.staffBook(caller, dto);
  }

  @Patch(':id/done')
  done(
    @CurrentUser() caller: AccessTokenPayload,
    @Param() { id }: IdParamDto,
    @Body() dto: MarkDoneDto,
  ) {
    return this.agenda.markDone(caller, id, dto);
  }

  @Patch(':id/cancel')
  cancel(
    @CurrentUser() caller: AccessTokenPayload,
    @Param() { id }: IdParamDto,
  ) {
    return this.agenda.staffCancel(caller, id);
  }
}

/** Weekly hours and time off of a professional. Owner/manager any; employee only self. */
@Controller('members/:professionalId')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ScheduleController {
  constructor(private readonly agenda: AgendaService) {}

  @Get('schedule')
  schedule(
    @CurrentUser() caller: AccessTokenPayload,
    @Param() { professionalId }: ProfessionalParamDto,
  ) {
    return this.agenda.getSchedule(caller, professionalId);
  }

  @Put('schedule')
  setSchedule(
    @CurrentUser() caller: AccessTokenPayload,
    @Param() { professionalId }: ProfessionalParamDto,
    @Body() dto: SetScheduleDto,
  ) {
    return this.agenda.setSchedule(caller, professionalId, dto);
  }

  @Get('time-off')
  timeOff(
    @CurrentUser() caller: AccessTokenPayload,
    @Param() { professionalId }: ProfessionalParamDto,
  ) {
    return this.agenda.listTimeOff(caller, professionalId);
  }

  @Post('time-off')
  createTimeOff(
    @CurrentUser() caller: AccessTokenPayload,
    @Param() { professionalId }: ProfessionalParamDto,
    @Body() dto: CreateTimeOffDto,
  ) {
    return this.agenda.createTimeOff(caller, professionalId, dto);
  }

  @Delete('time-off/:id')
  @HttpCode(204)
  deleteTimeOff(
    @CurrentUser() caller: AccessTokenPayload,
    @Param() { professionalId, id }: TimeOffParamDto,
  ) {
    return this.agenda.deleteTimeOff(caller, professionalId, id);
  }
}
