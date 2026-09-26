import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard, Roles, RolesGuard, TenantId } from '../auth/jwt';
import {
  AdjustQuantityDto,
  CreateStockItemDto,
  IdParamDto,
  UpdateStockItemDto,
} from './dto/stock.dto';
import { StockService } from './stock.service';

/**
 * Internal consumables. Any member reads and adjusts quantities (they are
 * used day to day); owner/manager manage the items themselves.
 */
@Controller('stock-items')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StockController {
  constructor(private readonly stock: StockService) {}

  @Get()
  list(@TenantId() tenantId: string) {
    return this.stock.list(tenantId);
  }

  @Post()
  @Roles('owner', 'manager')
  create(@TenantId() tenantId: string, @Body() dto: CreateStockItemDto) {
    return this.stock.create(tenantId, dto);
  }

  @Patch(':id')
  @Roles('owner', 'manager')
  update(
    @TenantId() tenantId: string,
    @Param() { id }: IdParamDto,
    @Body() dto: UpdateStockItemDto,
  ) {
    return this.stock.update(tenantId, id, dto);
  }

  @Patch(':id/quantity')
  adjust(
    @TenantId() tenantId: string,
    @Param() { id }: IdParamDto,
    @Body() dto: AdjustQuantityDto,
  ) {
    return this.stock.adjust(tenantId, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @Roles('owner', 'manager')
  remove(@TenantId() tenantId: string, @Param() { id }: IdParamDto) {
    return this.stock.remove(tenantId, id);
  }
}
