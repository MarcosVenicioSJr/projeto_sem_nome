import { HttpStatus, Injectable } from '@nestjs/common';
import { hash } from 'bcryptjs';
import type { CreateEmployeeInput, UpdateEmployeeInput } from '@org/contracts';
import { AppException } from '../common/app.exception';
import {
  MEMBER_ROLE,
  MembersRepository,
  type MemberEntity,
} from '../database';
import { toMember } from '../user/user.mapper';

const BCRYPT_ROUNDS = 12; // spec §4.2 (10–12)

/**
 * Employee management, always scoped to the caller's tenant (taken from the
 * owner's token, never from the request).
 */
@Injectable()
export class MemberService {
  constructor(private readonly members: MembersRepository) {}

  async createEmployee(tenantId: string, input: CreateEmployeeInput) {
    if (await this.members.existsByEmail(input.email)) {
      throw new AppException('errors.auth.emailTaken', HttpStatus.CONFLICT);
    }
    const employee = await this.members.create({
      tenantId,
      role:
        input.role === 'manager' ? MEMBER_ROLE.MANAGER : MEMBER_ROLE.EMPLOYEE,
      commissionRate:
        input.commissionRate == null ? null : String(input.commissionRate),
      name: input.name,
      email: input.email,
      phone: input.phone,
      passwordHash: await hash(input.password, BCRYPT_ROUNDS),
    });
    return toMember(employee);
  }

  /** The whole team (owner, managers, employees) — everyone can provide services. */
  async listTeam(tenantId: string) {
    return (await this.members.listAll(tenantId)).map(toMember);
  }

  async listEmployees(tenantId: string) {
    return (await this.members.listEmployees(tenantId)).map(toMember);
  }

  async updateEmployee(
    tenantId: string,
    id: string,
    input: UpdateEmployeeInput,
  ) {
    const employee = await this.findEmployee(tenantId, id);
    if (
      input.email &&
      input.email !== employee.email &&
      (await this.members.existsByEmail(input.email))
    ) {
      throw new AppException('errors.auth.emailTaken', HttpStatus.CONFLICT);
    }
    const { commissionRate, ...profile } = input;
    await this.members.update(id, {
      ...profile,
      ...(commissionRate === undefined
        ? {}
        : {
            commissionRate:
              commissionRate === null ? null : String(commissionRate),
          }),
    });
    return toMember(await this.findEmployee(tenantId, id));
  }

  private async findEmployee(
    tenantId: string,
    id: string,
  ): Promise<MemberEntity> {
    const employee = await this.members.findEmployee(tenantId, id);
    if (!employee) {
      throw new AppException('errors.member.notFound', HttpStatus.NOT_FOUND);
    }
    return employee;
  }
}
