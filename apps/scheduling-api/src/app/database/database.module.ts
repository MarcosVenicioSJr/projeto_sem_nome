import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { Env } from '../config';
import { MemberEntity } from './entities/member.entity';
import { TenantEntity } from './entities/tenant.entity';
import { AppointmentEntity } from './entities/appointment.entity';
import { AppointmentServiceEntity } from './entities/appointment-service.entity';
import { ExpenseEntryEntity } from './entities/expense-entry.entity';
import { ProductEntity } from './entities/product.entity';
import { ProfessionalScheduleEntity } from './entities/professional-schedule.entity';
import { ProfessionalServiceEntity } from './entities/professional-service.entity';
import { ProfessionalTimeOffEntity } from './entities/professional-time-off.entity';
import { RevenueEntryEntity } from './entities/revenue-entry.entity';
import { ServiceEntity } from './entities/service.entity';
import { StockItemEntity } from './entities/stock-item.entity';
import { AppointmentsRepository } from './repositories/appointments.repository';
import { ExpenseEntriesRepository } from './repositories/expense-entries.repository';
import { ProductsRepository } from './repositories/products.repository';
import { ProfessionalAvailabilityRepository } from './repositories/professional-availability.repository';
import { ProfessionalServicesRepository } from './repositories/professional-services.repository';
import { ServicesRepository } from './repositories/services.repository';
import { StockItemsRepository } from './repositories/stock-items.repository';

import { MembersRepository } from './repositories/members.repository';
import { TenantsRepository } from './repositories/tenants.repository';

const ENTITIES = [
  TenantEntity,
  MemberEntity,
  AppointmentEntity,
  AppointmentServiceEntity,
  ExpenseEntryEntity,
  ProductEntity,
  ProfessionalScheduleEntity,
  ProfessionalServiceEntity,
  ProfessionalTimeOffEntity,
  RevenueEntryEntity,
  ServiceEntity,
  StockItemEntity,
];

const REPOSITORIES = [
  TenantsRepository,
  MembersRepository,
  AppointmentsRepository,
  ExpenseEntriesRepository,
  ProductsRepository,
  ProfessionalAvailabilityRepository,
  ProfessionalServicesRepository,
  ServicesRepository,
  StockItemsRepository,
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
