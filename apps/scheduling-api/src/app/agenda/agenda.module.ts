import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database';
import { AgendaController, PublicAgendaController, ScheduleController } from './agenda.controller';
import { AgendaService } from './agenda.service';

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [PublicAgendaController, AgendaController, ScheduleController],
  providers: [AgendaService],
})
export class AgendaModule {}
