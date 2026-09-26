import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard, Roles, RolesGuard, TenantId } from '../auth/jwt';
import {
  CommissionsQueryDto,
  CreateExpenseDto,
  IdParamDto,
  MonthlyReportQueryDto,
  UpdateExpenseDto,
} from './dto/finance.dto';
import { FinanceService } from './finance.service';

/** Expenses, daily commission closing and monthly reports. Owner/manager only. */
@Controller('finance')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('owner', 'manager')
export class FinanceController {
  constructor(private readonly finance: FinanceService) {}

  @Get('expenses')
  listExpenses(@TenantId() tenantId: string) {
    return this.finance.listExpenses(tenantId);
  }

  @Post('expenses')
  createExpense(@TenantId() tenantId: string, @Body() dto: CreateExpenseDto) {
    return this.finance.createExpense(tenantId, dto);
  }

  @Patch('expenses/:id')
  updateExpense(
    @TenantId() tenantId: string,
    @Param() { id }: IdParamDto,
    @Body() dto: UpdateExpenseDto,
  ) {
    return this.finance.updateExpense(tenantId, id, dto);
  }

  @Delete('expenses/:id')
  @HttpCode(204)
  removeExpense(@TenantId() tenantId: string, @Param() { id }: IdParamDto) {
    return this.finance.removeExpense(tenantId, id);
  }

  @Get('commissions')
  commissions(@TenantId() tenantId: string, @Query() { date }: CommissionsQueryDto) {
    return this.finance.commissions(tenantId, date);
  }

  @Get('revenues')
  revenues(@TenantId() tenantId: string, @Query() { date }: CommissionsQueryDto) {
    return this.finance.revenues(tenantId, date);
  }

  @Get('reports/revenue')
  revenue(@TenantId() tenantId: string, @Query() { month }: MonthlyReportQueryDto) {
    return this.finance.monthlyRevenue(tenantId, month);
  }

  @Get('reports/clients')
  clients(@TenantId() tenantId: string, @Query() { month }: MonthlyReportQueryDto) {
    return this.finance.monthlyClients(tenantId, month);
  }
}
