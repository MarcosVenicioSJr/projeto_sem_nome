import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { Env } from '../config';
import { ClientEntity } from './entities/client.entity';
import { MemberEntity } from './entities/member.entity';
import { TenantClientEntity } from './entities/tenant-client.entity';
import { TenantEntity } from './entities/tenant.entity';

import { ClientsRepository } from './repositories/clients.repository';
import { MembersRepository } from './repositories/members.repository';
import { TenantsRepository } from './repositories/tenants.repository';

const ENTITIES = [
  TenantEntity,
  MemberEntity,
  ClientEntity,
  TenantClientEntity,
];

const REPOSITORIES = [
  TenantsRepository,
  MembersRepository,
  ClientsRepository,
];

/**
 * Persistence layer. Opens the connection (forRootAsync, reading ConfigService)
 * and exposes the domain repositories. Auth and User just import this module.
 */
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        type: 'postgres',
        host: config.get('DB_HOST', { infer: true }),
        port: config.get('DB_PORT', { infer: true }),
        username: config.get('DB_USER', { infer: true }),
        password: config.get('DB_PASSWORD', { infer: true }),
        database: config.get('DB_NAME', { infer: true }),
        entities: ENTITIES,
        // Schema is managed by Atlas (see atlas.hcl / docs/arch/migrations.md).
        // TypeORM never touches the schema.
        synchronize: false,
        logging: config.get('DB_LOGGING', { infer: true }),
      }),
    }),
    TypeOrmModule.forFeature(ENTITIES),
  ],
  providers: REPOSITORIES,
  exports: REPOSITORIES,
})
export class DatabaseModule {}
