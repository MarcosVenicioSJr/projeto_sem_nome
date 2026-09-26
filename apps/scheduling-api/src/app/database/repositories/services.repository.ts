import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ServiceEntity } from '../entities/service.entity';

@Injectable()
export class ServicesRepository {
  constructor(
    @InjectRepository(ServiceEntity)
    private readonly repo: Repository<ServiceEntity>,
  ) {}

  list(tenantId: string): Promise<ServiceEntity[]> {
    return this.repo.find({ where: { tenantId }, order: { name: 'ASC' } });
  }

  find(tenantId: string, id: string): Promise<ServiceEntity | null> {
    return this.repo.findOne({ where: { id, tenantId } });
  }

  findByIds(tenantId: string, ids: string[]): Promise<ServiceEntity[]> {
    return this.repo.find({ where: { tenantId, id: In(ids) } });
  }

  create(data: Partial<ServiceEntity>): Promise<ServiceEntity> {
    return this.repo.save(this.repo.create(data));
  }

  async update(
    tenantId: string,
    id: string,
    patch: Partial<ServiceEntity>,
  ): Promise<void> {
    await this.repo.update({ id, tenantId }, patch);
  }

  /** Returns false when nothing was deleted (unknown id / other tenant). */
  async delete(tenantId: string, id: string): Promise<boolean> {
    const res = await this.repo.delete({ id, tenantId });
    return (res.affected ?? 0) > 0;
  }
}
