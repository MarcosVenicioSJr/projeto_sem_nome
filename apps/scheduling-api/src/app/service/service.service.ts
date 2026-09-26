import { HttpStatus, Injectable } from '@nestjs/common';
import type {
  AccessTokenPayload,
  CreateServiceInput,
  ProfessionalService,
  Service,
  UpdateServiceInput,
  UpsertProfessionalServiceInput,
} from '@org/contracts';
import { assertManagerOrSelf } from '../common/access';
import { AppException } from '../common/app.exception';
import {
  MembersRepository,
  ProfessionalServicesRepository,
  ServicesRepository,
  type ProfessionalServiceEntity,
  type ServiceEntity,
} from '../database';

const toService = (e: ServiceEntity): Service => ({ id: e.id, name: e.name });

export const toProfessionalService = (
  e: ProfessionalServiceEntity,
): ProfessionalService => ({
  id: e.id,
  professionalId: e.professionalId,
  serviceId: e.serviceId,
  price: Number(e.price),
  durationMinutes: e.durationMinutes,
});

/** Tenant service catalog (name only) and what each professional offers. */
@Injectable()
export class ServiceService {
  constructor(
    private readonly services: ServicesRepository,
    private readonly professionalServices: ProfessionalServicesRepository,
    private readonly members: MembersRepository,
  ) {}

  async list(tenantId: string) {
    return (await this.services.list(tenantId)).map(toService);
  }

  async create(tenantId: string, input: CreateServiceInput) {
    return toService(await this.services.create({ tenantId, ...input }));
  }

  async update(tenantId: string, id: string, input: UpdateServiceInput) {
    await this.findOrFail(tenantId, id);
    await this.services.update(tenantId, id, input);
    return toService(await this.findOrFail(tenantId, id));
  }

  async remove(tenantId: string, id: string): Promise<void> {
    await this.findOrFail(tenantId, id);
    try {
      await this.services.delete(tenantId, id);
    } catch (e) {
      const code = e as { code?: string; driverError?: { code?: string } };
      if ((code.code ?? code.driverError?.code) === '23503') {
        throw new AppException('errors.service.inUse', HttpStatus.CONFLICT);
      }
      throw e;
    }
  }

  async listOffers(tenantId: string) {
    return (await this.professionalServices.listByTenant(tenantId)).map(
      toProfessionalService,
    );
  }

  async listForProfessional(
    caller: AccessTokenPayload,
    professionalId: string,
  ) {
    await this.authorize(caller, professionalId);
    return (
      await this.professionalServices.list(caller.tenantId, professionalId)
    ).map(toProfessionalService);
  }

  async upsertForProfessional(
    caller: AccessTokenPayload,
    professionalId: string,
    input: UpsertProfessionalServiceInput,
  ) {
    await this.authorize(caller, professionalId);
    await this.findOrFail(caller.tenantId, input.serviceId);
    return toProfessionalService(
      await this.professionalServices.upsert({
        tenantId: caller.tenantId,
        professionalId,
        serviceId: input.serviceId,
        price: String(input.price),
        durationMinutes: input.durationMinutes,
      }),
    );
  }

  async removeForProfessional(
    caller: AccessTokenPayload,
    professionalId: string,
    serviceId: string,
  ): Promise<void> {
    await this.authorize(caller, professionalId);
    const deleted = await this.professionalServices.delete(
      caller.tenantId,
      professionalId,
      serviceId,
    );
    if (!deleted) {
      throw new AppException('errors.service.notFound', HttpStatus.NOT_FOUND);
    }
  }

  private async authorize(caller: AccessTokenPayload, professionalId: string) {
    assertManagerOrSelf(caller, professionalId);
    if (!(await this.members.findInTenant(caller.tenantId, professionalId))) {
      throw new AppException('errors.member.notFound', HttpStatus.NOT_FOUND);
    }
  }

  private async findOrFail(
    tenantId: string,
    id: string,
  ): Promise<ServiceEntity> {
    const service = await this.services.find(tenantId, id);
    if (!service) {
      throw new AppException('errors.service.notFound', HttpStatus.NOT_FOUND);
    }
    return service;
  }
}
