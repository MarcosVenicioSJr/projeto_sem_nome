import { HttpStatus, Injectable } from '@nestjs/common';
import { hash } from 'bcryptjs';
import type { CreateTenantInput, Tenant } from '@org/contracts';
import { AppException } from '../common/app.exception';
import {
  MembersRepository,
  TenantsRepository,
  type TenantEntity,
} from '../database';
import { toMember } from '../user/user.mapper';

const BCRYPT_ROUNDS = 12; // spec §4.2 (10–12)

export const toTenant = (e: TenantEntity): Tenant => ({
  id: e.id,
  name: e.name,
  slug: e.slug,
  createdAt: e.createdAt.toISOString(),
  updatedAt: e.updatedAt.toISOString(),
});

@Injectable()
export class TenantService {
  constructor(
    private readonly tenants: TenantsRepository,
    private readonly members: MembersRepository,
  ) {}

  /** Onboarding: creates the company and its owner account. */
  async create(input: CreateTenantInput) {
    if (await this.tenants.existsBySlug(input.tenant.slug)) {
      throw new AppException('errors.tenant.slugTaken', HttpStatus.CONFLICT);
    }
    if (await this.members.existsByEmail(input.owner.email)) {
      throw new AppException('errors.auth.emailTaken', HttpStatus.CONFLICT);
    }

    const { tenant, owner } = await this.tenants.createWithOwner(
      input.tenant,
      {
        name: input.owner.name,
        email: input.owner.email,
        phone: input.owner.phone,
        passwordHash: await hash(input.owner.password, BCRYPT_ROUNDS),
      },
    );
    return { tenant: toTenant(tenant), owner: toMember(owner) };
  }

  async findById(tenantId: string) {
    const tenant = await this.tenants.findById(tenantId);
    if (!tenant) {
      throw new AppException('errors.tenant.notFound', HttpStatus.NOT_FOUND);
    }
    return toTenant(tenant);
  }

  /** Public data for the booking page behind `/agendar/:slug`. */
  async findPublic(slug: string) {
    const tenant = await this.findBySlug(slug);
    return { name: tenant.name, slug: tenant.slug };
  }

  private async findBySlug(slug: string): Promise<TenantEntity> {
    const tenant = await this.tenants.findBySlug(slug);
    if (!tenant) {
      throw new AppException('errors.tenant.notFound', HttpStatus.NOT_FOUND);
    }
    return tenant;
  }
}
