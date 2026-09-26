import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database';
import { ProfessionalServiceController, ServiceController } from './service.controller';
import { ServiceService } from './service.service';

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [ServiceController, ProfessionalServiceController],
  providers: [ServiceService],
})
export class ServiceModule {}
