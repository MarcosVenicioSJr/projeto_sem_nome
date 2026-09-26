import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard, Roles, RolesGuard, TenantId } from '../auth/jwt';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { EmployeeIdParamDto } from './dto/employee-id-param.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { MemberService } from './member.service';

/** Employee management. Owner/manager only; the tenant comes from the owner's token. */
@Controller('members/employees')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('owner', 'manager')
export class MemberController {
  constructor(private readonly memberService: MemberService) {}

  @Post()
  create(@TenantId() tenantId: string, @Body() dto: CreateEmployeeDto) {
    return this.memberService.createEmployee(tenantId, dto);
  }

  @Get()
  list(@TenantId() tenantId: string) {
    return this.memberService.listEmployees(tenantId);
  }

  @Patch(':id')
  update(
    @TenantId() tenantId: string,
    @Param() { id }: EmployeeIdParamDto,
    @Body() dto: UpdateEmployeeDto,
  ) {
    return this.memberService.updateEmployee(tenantId, id, dto);
  }
}

/** The whole team, owner included. Owner/manager only. */
@Controller('members')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('owner', 'manager')
export class TeamController {
  constructor(private readonly memberService: MemberService) {}

  @Get()
  list(@TenantId() tenantId: string) {
    return this.memberService.listTeam(tenantId);
  }
}
