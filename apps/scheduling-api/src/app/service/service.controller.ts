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
  UseGuards,
} from '@nestjs/common';
import type { AccessTokenPayload } from '@org/contracts';
import {
  CurrentUser,
  JwtAuthGuard,
  Roles,
  RolesGuard,
  TenantId,
} from '../auth/jwt';
import {
  CreateServiceDto,
  IdParamDto,
  ProfessionalParamDto,
  ProfessionalServiceParamDto,
  UpdateServiceDto,
  UpsertProfessionalServiceDto,
} from './dto/service.dto';
import { ServiceService } from './service.service';

/** Tenant service catalog. Owner/manager only; any member can read it. */
@Controller('services')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ServiceController {
  constructor(private readonly service: ServiceService) {}

  @Get()
  list(@TenantId() tenantId: string) {
    return this.service.list(tenantId);
  }

  /** Every professional's price/duration per service, for the whole tenant. */
  @Get('offers')
  @Roles('owner', 'manager')
  offers(@TenantId() tenantId: string) {
    return this.service.listOffers(tenantId);
  }

  @Post()
  @Roles('owner', 'manager')
  create(@TenantId() tenantId: string, @Body() dto: CreateServiceDto) {
    return this.service.create(tenantId, dto);
  }

  @Patch(':id')
  @Roles('owner', 'manager')
  update(
    @TenantId() tenantId: string,
    @Param() { id }: IdParamDto,
    @Body() dto: UpdateServiceDto,
  ) {
    return this.service.update(tenantId, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @Roles('owner', 'manager')
  remove(@TenantId() tenantId: string, @Param() { id }: IdParamDto) {
    return this.service.remove(tenantId, id);
  }
}

/**
 * The services a professional performs, each with their own price and
 * duration. Owner/manager act on anyone; an employee only on themself.
 */
@Controller('members/:professionalId/services')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProfessionalServiceController {
  constructor(private readonly service: ServiceService) {}

  @Get()
  list(
    @CurrentUser() caller: AccessTokenPayload,
    @Param() { professionalId }: ProfessionalParamDto,
  ) {
    return this.service.listForProfessional(caller, professionalId);
  }

  @Put()
  upsert(
    @CurrentUser() caller: AccessTokenPayload,
    @Param() { professionalId }: ProfessionalParamDto,
    @Body() dto: UpsertProfessionalServiceDto,
  ) {
    return this.service.upsertForProfessional(caller, professionalId, dto);
  }

  @Delete(':serviceId')
  @HttpCode(204)
  remove(
    @CurrentUser() caller: AccessTokenPayload,
    @Param() { professionalId, serviceId }: ProfessionalServiceParamDto,
  ) {
    return this.service.removeForProfessional(
      caller,
      professionalId,
      serviceId,
    );
  }
}
