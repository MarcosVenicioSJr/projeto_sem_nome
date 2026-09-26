import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExpenseEntryEntity } from '../entities/expense-entry.entity';

@Injectable()
export class ExpenseEntriesRepository {
  constructor(
    @InjectRepository(ExpenseEntryEntity)
    private readonly repo: Repository<ExpenseEntryEntity>,
  ) {}

  list(tenantId: string): Promise<ExpenseEntryEntity[]> {
    return this.repo.find({
      where: { tenantId },
      order: { date: 'DESC', createdAt: 'DESC' },
    });
  }

  find(tenantId: string, id: string): Promise<ExpenseEntryEntity | null> {
    return this.repo.findOne({ where: { id, tenantId } });
  }

  create(data: Partial<ExpenseEntryEntity>): Promise<ExpenseEntryEntity> {
    return this.repo.save(this.repo.create(data));
  }

  async update(
    tenantId: string,
    id: string,
    patch: Partial<ExpenseEntryEntity>,
  ): Promise<void> {
    await this.repo.update({ id, tenantId }, patch);
  }

  async delete(tenantId: string, id: string): Promise<boolean> {
    const res = await this.repo.delete({ id, tenantId });
    return (res.affected ?? 0) > 0;
  }
}
