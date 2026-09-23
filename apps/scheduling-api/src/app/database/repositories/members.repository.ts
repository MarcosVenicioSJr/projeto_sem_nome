import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MEMBER_ROLE } from '../enums';
import { Repository } from 'typeorm';
import { MemberEntity } from '../entities/member.entity';

/** Services depend on THIS class, never on TypeORM's `Repository` directly. */
@Injectable()
export class MembersRepository {
  constructor(
    @InjectRepository(MemberEntity)
    private readonly repo: Repository<MemberEntity>,
  ) {}

  findById(id: string): Promise<MemberEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  findByEmail(email: string): Promise<MemberEntity | null> {
    return this.repo.findOne({ where: { email } });
  }

  existsByEmail(email: string): Promise<boolean> {
    return this.repo.existsBy({ email });
  }

  create(data: Partial<MemberEntity>): Promise<MemberEntity> {
    return this.repo.save(this.repo.create(data));
  }

  async update(id: string, patch: Partial<MemberEntity>): Promise<void> {
    await this.repo.update({ id }, patch);
  }

  listEmployees(tenantId: string): Promise<MemberEntity[]> {
    return this.repo.find({
      where: { tenantId, role: MEMBER_ROLE.EMPLOYEE },
      order: { name: 'ASC' },
    });
  }

  /** Scoped to the tenant so an owner can never reach another tenant's employee. */
  findEmployee(tenantId: string, id: string): Promise<MemberEntity | null> {
    return this.repo.findOne({ where: { id, tenantId, role: MEMBER_ROLE.EMPLOYEE } });
  }
}
