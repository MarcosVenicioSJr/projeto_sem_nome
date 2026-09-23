import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser, JwtAuthGuard, Roles, RolesGuard } from '../auth/jwt';
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

  /** Public: what the booking page shows for `/agendar/:slug`. */
  @Get('t/:slug')
  findPublic(@Param() { slug }: TenantSlugParamDto) {
    return this.tenantService.findPublic(slug);
  }

  /** A logged-in client opens the tenant's link: links the account to it. */
  @Post('t/:slug/clients/join')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('client')
  join(
    @Param() { slug }: TenantSlugParamDto,
    @CurrentUser('sub') clientId: string,
  ) {
    return this.tenantService.linkClient(slug, clientId);
  }
}
