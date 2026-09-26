import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductEntity } from '../entities/product.entity';

@Injectable()
export class ProductsRepository {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly repo: Repository<ProductEntity>,
  ) {}

  list(tenantId: string): Promise<ProductEntity[]> {
    return this.repo.find({ where: { tenantId }, order: { name: 'ASC' } });
  }

  find(tenantId: string, id: string): Promise<ProductEntity | null> {
    return this.repo.findOne({ where: { id, tenantId } });
  }

  create(data: Partial<ProductEntity>): Promise<ProductEntity> {
    return this.repo.save(this.repo.create(data));
  }

  async update(
    tenantId: string,
    id: string,
    patch: Partial<ProductEntity>,
  ): Promise<void> {
    await this.repo.update({ id, tenantId }, patch);
  }

  async delete(tenantId: string, id: string): Promise<boolean> {
    const res = await this.repo.delete({ id, tenantId });
    return (res.affected ?? 0) > 0;
  }
}
