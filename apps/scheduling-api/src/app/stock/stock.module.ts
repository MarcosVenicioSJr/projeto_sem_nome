import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database';
import { StockController } from './stock.controller';
import { StockService } from './stock.service';

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [StockController],
  providers: [StockService],
})
export class StockModule {}
