import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockItemEntity } from '../entities/stock-item.entity';

@Injectable()
export class StockItemsRepository {
  constructor(
    @InjectRepository(StockItemEntity)
    private readonly repo: Repository<StockItemEntity>,
  ) {}

  list(tenantId: string): Promise<StockItemEntity[]> {
    return this.repo.find({ where: { tenantId }, order: { name: 'ASC' } });
  }

  find(tenantId: string, id: string): Promise<StockItemEntity | null> {
    return this.repo.findOne({ where: { id, tenantId } });
  }

  create(data: Partial<StockItemEntity>): Promise<StockItemEntity> {
    return this.repo.save(this.repo.create(data));
  }

  async update(
    tenantId: string,
    id: string,
    patch: Partial<StockItemEntity>,
  ): Promise<void> {
    await this.repo.update({ id, tenantId }, patch);
  }

  async delete(tenantId: string, id: string): Promise<boolean> {
    const res = await this.repo.delete({ id, tenantId });
    return (res.affected ?? 0) > 0;
  }

  /** Atomic adjustment; returns false if the item is unknown or would go below zero. */
  async adjust(tenantId: string, id: string, delta: number): Promise<boolean> {
    const res = await this.repo
      .createQueryBuilder()
      .update()
      .set({ quantity: () => `quantity + ${Number(delta)}` })
      .where('id = :id AND tenant_id = :tenantId', { id, tenantId })
      .andWhere(`quantity + ${Number(delta)} >= 0`)
      .execute();
    return (res.affected ?? 0) > 0;
  }
}
