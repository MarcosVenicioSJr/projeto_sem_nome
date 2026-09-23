import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { MEMBER_ROLE } from '../enums';
import { MemberEntity } from '../entities/member.entity';
import { TenantClientEntity } from '../entities/tenant-client.entity';
import { TenantEntity } from '../entities/tenant.entity';

@Injectable()
export class TenantsRepository {
  constructor(
    @InjectRepository(TenantEntity)
    private readonly repo: Repository<TenantEntity>,
    @InjectRepository(TenantClientEntity)
    private readonly links: Repository<TenantClientEntity>,
    private readonly dataSource: DataSource,
  ) {}

  findBySlug(slug: string): Promise<TenantEntity | null> {
    return this.repo.findOne({ where: { slug } });
  }

  existsBySlug(slug: string): Promise<boolean> {
    return this.repo.existsBy({ slug });
  }

  /** Onboarding: the company and its owner are created together or not at all. */
  createWithOwner(
    tenant: Pick<TenantEntity, 'name' | 'slug'>,
    owner: Pick<MemberEntity, 'name' | 'email' | 'phone' | 'passwordHash'>,
  ): Promise<{ tenant: TenantEntity; owner: MemberEntity }> {
    return this.dataSource.transaction(async (manager) => {
      const savedTenant = await manager.save(
        manager.create(TenantEntity, tenant),
      );
      const savedOwner = await manager.save(
        manager.create(MemberEntity, {
          ...owner,
          tenantId: savedTenant.id,
          role: MEMBER_ROLE.OWNER,
        }),
      );
      return { tenant: savedTenant, owner: savedOwner };
    });
  }

  /** Links a client to a tenant. Idempotent: linking twice is a no-op. */
  async linkClient(tenantId: string, clientId: string): Promise<void> {
    await this.links
      .createQueryBuilder()
      .insert()
      .values({ tenantId, clientId })
      .orIgnore()
      .execute();
  }
}
