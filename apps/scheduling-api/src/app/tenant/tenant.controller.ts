import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard, TenantId } from '../auth/jwt';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { TenantSlugParamDto } from './dto/tenant-slug-param.dto';
import { TenantService } from './tenant.service';

@Controller()
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  /** Onboarding: the buyer becomes the tenant's owner. */
  @Post('tenants')
  create(@Body() dto: CreateTenantDto) {
    return this.tenantService.create(dto);
  }

  /** The caller's own company. */
  @Get('tenants/me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  me(@TenantId() tenantId: string) {
    return this.tenantService.findById(tenantId);
  }

  /** Public: what the booking page shows for `/agendar/:slug`. */
  @Get('t/:slug')
  findPublic(@Param() { slug }: TenantSlugParamDto) {
    return this.tenantService.findPublic(slug);
  }
}
