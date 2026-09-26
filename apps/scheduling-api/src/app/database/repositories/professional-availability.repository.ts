import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ProfessionalScheduleEntity } from '../entities/professional-schedule.entity';
import { ProfessionalTimeOffEntity } from '../entities/professional-time-off.entity';

/** Weekly hours and time-off blocks of a professional. */
@Injectable()
export class ProfessionalAvailabilityRepository {
  constructor(
    @InjectRepository(ProfessionalScheduleEntity)
    private readonly schedules: Repository<ProfessionalScheduleEntity>,
    @InjectRepository(ProfessionalTimeOffEntity)
    private readonly timeOff: Repository<ProfessionalTimeOffEntity>,
    private readonly dataSource: DataSource,
  ) {}

  week(professionalId: string): Promise<ProfessionalScheduleEntity[]> {
    return this.schedules.find({
      where: { professionalId },
      order: { weekday: 'ASC' },
    });
  }

  dayOfWeek(
    professionalId: string,
    weekday: number,
  ): Promise<ProfessionalScheduleEntity | null> {
    return this.schedules.findOne({ where: { professionalId, weekday } });
  }

  /** Replaces the whole week atomically. */
  replaceWeek(
    tenantId: string,
    professionalId: string,
    days: Omit<
      ProfessionalScheduleEntity,
      'id' | 'tenantId' | 'professionalId' | 'professional'
    >[],
  ): Promise<void> {
    return this.dataSource.transaction(async (manager) => {
      await manager.delete(ProfessionalScheduleEntity, { professionalId });
      if (days.length) {
        await manager.insert(
          ProfessionalScheduleEntity,
          days.map((d) => ({ ...d, tenantId, professionalId })),
        );
      }
    });
  }

  timeOffOn(
    professionalId: string,
    date: string,
  ): Promise<ProfessionalTimeOffEntity[]> {
    return this.timeOff.find({ where: { professionalId, date } });
  }

  listTimeOff(
    tenantId: string,
    professionalId: string,
  ): Promise<ProfessionalTimeOffEntity[]> {
    return this.timeOff.find({
      where: { tenantId, professionalId },
      order: { date: 'ASC' },
    });
  }

  createTimeOff(
    data: Partial<ProfessionalTimeOffEntity>,
  ): Promise<ProfessionalTimeOffEntity> {
    return this.timeOff.save(this.timeOff.create(data));
  }

  async deleteTimeOff(
    tenantId: string,
    professionalId: string,
    id: string,
  ): Promise<boolean> {
    const res = await this.timeOff.delete({ id, tenantId, professionalId });
    return (res.affected ?? 0) > 0;
  }
}
