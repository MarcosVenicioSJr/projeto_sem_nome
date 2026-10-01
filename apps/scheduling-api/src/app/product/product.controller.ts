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
  CreateProductDto,
  IdParamDto,
  UpdateProductDto,
} from './dto/product.dto';
import { ProductService } from './product.service';

/** Products for sale. Owner/manager only. */
@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('owner', 'manager')
export class ProductController {
  constructor(private readonly product: ProductService) {}

  @Get()
  list(@TenantId() tenantId: string) {
    return this.product.list(tenantId);
  }

  @Post()
  create(@TenantId() tenantId: string, @Body() dto: CreateProductDto) {
    return this.product.create(tenantId, dto);
  }

  @Patch(':id')
  update(
    @TenantId() tenantId: string,
    @Param() { id }: IdParamDto,
    @Body() dto: UpdateProductDto,
  ) {
    return this.product.update(tenantId, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@TenantId() tenantId: string, @Param() { id }: IdParamDto) {
    return this.product.remove(tenantId, id);
  }
}
