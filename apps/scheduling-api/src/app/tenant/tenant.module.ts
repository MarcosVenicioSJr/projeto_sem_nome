import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database';
import { TenantController } from './tenant.controller';
import { TenantService } from './tenant.service';

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [TenantController],
  providers: [TenantService],
})
export class TenantModule {}
