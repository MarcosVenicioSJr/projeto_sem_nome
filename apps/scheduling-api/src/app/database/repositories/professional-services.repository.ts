import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ProfessionalServiceEntity } from '../entities/professional-service.entity';

@Injectable()
export class ProfessionalServicesRepository {
  constructor(
    @InjectRepository(ProfessionalServiceEntity)
    private readonly repo: Repository<ProfessionalServiceEntity>,
  ) {}

  list(
    tenantId: string,
    professionalId: string,
  ): Promise<ProfessionalServiceEntity[]> {
    return this.repo.find({ where: { tenantId, professionalId } });
  }

  findMany(
    tenantId: string,
    professionalId: string,
    serviceIds: string[],
  ): Promise<ProfessionalServiceEntity[]> {
    return this.repo.find({
      where: { tenantId, professionalId, serviceId: In(serviceIds) },
    });
  }

  /** Lists every professional-service of the tenant (public booking page). */
  listByTenant(tenantId: string): Promise<ProfessionalServiceEntity[]> {
    return this.repo.find({ where: { tenantId } });
  }

  async upsert(
    data: Pick<
      ProfessionalServiceEntity,
      'tenantId' | 'professionalId' | 'serviceId' | 'price' | 'durationMinutes'
    >,
  ): Promise<ProfessionalServiceEntity> {
    await this.repo.upsert(data, ['professionalId', 'serviceId']);
    return this.repo.findOneOrFail({
      where: {
        professionalId: data.professionalId,
        serviceId: data.serviceId,
      },
    });
  }

  async delete(
    tenantId: string,
    professionalId: string,
    serviceId: string,
  ): Promise<boolean> {
    const res = await this.repo.delete({ tenantId, professionalId, serviceId });
    return (res.affected ?? 0) > 0;
  }
}
