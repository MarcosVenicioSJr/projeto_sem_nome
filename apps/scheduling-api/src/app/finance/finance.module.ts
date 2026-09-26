import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [FinanceController],
  providers: [FinanceService],
})
export class FinanceModule {}
