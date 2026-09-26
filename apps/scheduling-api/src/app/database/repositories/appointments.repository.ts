import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { APPOINTMENT_STATUS, type PaymentMethod } from '../enums';
import { AppointmentServiceEntity } from '../entities/appointment-service.entity';
import { AppointmentEntity } from '../entities/appointment.entity';
import { RevenueEntryEntity } from '../entities/revenue-entry.entity';

export type CommissionBaseRow = {
  professionalId: string;
  professionalName: string;
  commissionRate: string | null;
  servicesDone: string;
  servicesTotal: string | null;
};

export type RevenueRow = {
  id: string;
  startAt: Date;
  clientName: string;
  professionalName: string;
  services: string | null;
  amount: string;
  paymentMethod: PaymentMethod;
};

@Injectable()
export class AppointmentsRepository {
  constructor(
    @InjectRepository(AppointmentEntity)
    private readonly repo: Repository<AppointmentEntity>,
    private readonly dataSource: DataSource,
  ) {}

  /** The booking and its services are created together or not at all. */
  createWithServices(
    data: Pick<
      AppointmentEntity,
      | 'tenantId'
      | 'professionalId'
      | 'clientName'
      | 'clientPhone'
      | 'startAt'
      | 'endAt'
      | 'cancelToken'
    >,
    services: Pick<
      AppointmentServiceEntity,
      'serviceId' | 'price' | 'durationMinutes'
    >[],
  ): Promise<AppointmentEntity> {
    return this.dataSource.transaction(async (manager) => {
      const appointment = await manager.save(
        manager.create(AppointmentEntity, data),
      );
      const rows = await manager.save(
        services.map((s) =>
          manager.create(AppointmentServiceEntity, {
            ...s,
            appointmentId: appointment.id,
          }),
        ),
      );
      appointment.services = rows;
      return appointment;
    });
  }

  find(tenantId: string, id: string): Promise<AppointmentEntity | null> {
    return this.repo.findOne({
      where: { id, tenantId },
      relations: { services: true },
    });
  }

  findByCancelToken(token: string): Promise<AppointmentEntity | null> {
    return this.repo.findOne({
      where: { cancelToken: token },
      relations: { services: true },
    });
  }

  /** All statuses, for the staff agenda. */
  listInRange(
    tenantId: string,
    from: Date,
    to: Date,
    professionalId?: string,
  ): Promise<AppointmentEntity[]> {
    return this.repo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.services', 's')
      .where('a.tenant_id = :tenantId', { tenantId })
      .andWhere('a.start_at >= :from AND a.start_at < :to', { from, to })
      .andWhere(
        professionalId ? 'a.professional_id = :professionalId' : '1=1',
        {
          professionalId,
        },
      )
      .orderBy('a.start_at', 'ASC')
      .getMany();
  }

  /** Bookings that occupy the professional's time (not cancelled) overlapping the range. */
  listActiveOverlapping(
    professionalId: string,
    from: Date,
    to: Date,
  ): Promise<AppointmentEntity[]> {
    return this.repo
      .createQueryBuilder('a')
      .where('a.professional_id = :professionalId', { professionalId })
      .andWhere('a.status != :cancelled', {
        cancelled: APPOINTMENT_STATUS.CANCELLED,
      })
      .andWhere('a.start_at < :to AND a.end_at > :from', { from, to })
      .orderBy('a.start_at', 'ASC')
      .getMany();
  }

  /** A phone's non-cancelled bookings in the range (daily-limit rule). */
  listActiveByPhone(
    tenantId: string,
    clientPhone: string,
    from: Date,
    to: Date,
  ): Promise<AppointmentEntity[]> {
    return this.repo
      .createQueryBuilder('a')
      .where('a.tenant_id = :tenantId AND a.client_phone = :clientPhone', {
        tenantId,
        clientPhone,
      })
      .andWhere('a.status != :cancelled', {
        cancelled: APPOINTMENT_STATUS.CANCELLED,
      })
      .andWhere('a.start_at >= :from AND a.start_at < :to', { from, to })
      .orderBy('a.start_at', 'ASC')
      .getMany();
  }

  async cancel(id: string): Promise<void> {
    await this.repo.update(
      { id },
      { status: APPOINTMENT_STATUS.CANCELLED, cancelledAt: new Date() },
    );
  }

  /** Marks the booking done and records what was received, atomically. */
  complete(
    appointment: AppointmentEntity,
    revenue: {
      amount: string;
      paymentMethod: PaymentMethod;
      recordedById: string;
    },
  ): Promise<void> {
    return this.dataSource.transaction(async (manager) => {
      await manager.update(
        AppointmentEntity,
        { id: appointment.id },
        { status: APPOINTMENT_STATUS.DONE },
      );
      await manager.save(
        manager.create(RevenueEntryEntity, {
          tenantId: appointment.tenantId,
          appointmentId: appointment.id,
          ...revenue,
        }),
      );
    });
  }

  /** Daily closing base: every non-cancelled service of the day, per professional. */
  commissionBase(
    tenantId: string,
    from: Date,
    to: Date,
  ): Promise<CommissionBaseRow[]> {
    return this.repo
      .createQueryBuilder('a')
      .innerJoin('a.services', 's')
      .innerJoin('a.professional', 'p')
      .select('a.professional_id', 'professionalId')
      .addSelect('p.name', 'professionalName')
      .addSelect('p.commission_rate', 'commissionRate')
      .addSelect('COUNT(s.id)', 'servicesDone')
      .addSelect('SUM(s.price)', 'servicesTotal')
      .where('a.tenant_id = :tenantId', { tenantId })
      .andWhere('a.status != :cancelled', {
        cancelled: APPOINTMENT_STATUS.CANCELLED,
      })
      .andWhere('a.start_at >= :from AND a.start_at < :to', { from, to })
      .groupBy('a.professional_id')
      .addGroupBy('p.name')
      .addGroupBy('p.commission_rate')
      .orderBy('p.name', 'ASC')
      .getRawMany<CommissionBaseRow>();
  }

  /** Total received on appointments done in the range. */
  async revenueTotal(tenantId: string, from: Date, to: Date): Promise<number> {
    const row = await this.dataSource
      .createQueryBuilder()
      .select('COALESCE(SUM(r.amount), 0)', 'total')
      .from(RevenueEntryEntity, 'r')
      .innerJoin(AppointmentEntity, 'a', 'a.id = r.appointment_id')
      .where('r.tenant_id = :tenantId', { tenantId })
      .andWhere('a.status = :done', { done: APPOINTMENT_STATUS.DONE })
      .andWhere('a.start_at >= :from AND a.start_at < :to', { from, to })
      .getRawOne<{ total: string }>();
    return Number(row?.total ?? 0);
  }

  /** Distinct phones with a done appointment in the range. */
  async distinctClients(
    tenantId: string,
    from: Date,
    to: Date,
  ): Promise<number> {
    const row = await this.repo
      .createQueryBuilder('a')
      .select('COUNT(DISTINCT a.client_phone)', 'total')
      .where('a.tenant_id = :tenantId', { tenantId })
      .andWhere('a.status = :done', { done: APPOINTMENT_STATUS.DONE })
      .andWhere('a.start_at >= :from AND a.start_at < :to', { from, to })
      .getRawOne<{ total: string }>();
    return Number(row?.total ?? 0);
  }

  /** Payments received for appointments done in the range, oldest first. */
  listRevenues(tenantId: string, from: Date, to: Date): Promise<RevenueRow[]> {
    return this.dataSource
      .createQueryBuilder()
      .select('r.id', 'id')
      .addSelect('a.start_at', 'startAt')
      .addSelect('a.client_name', 'clientName')
      .addSelect('p.name', 'professionalName')
      .addSelect("string_agg(s.name, ' + ' ORDER BY s.name)", 'services')
      .addSelect('r.amount', 'amount')
      .addSelect('r.payment_method', 'paymentMethod')
      .from(RevenueEntryEntity, 'r')
      .innerJoin(AppointmentEntity, 'a', 'a.id = r.appointment_id')
      .innerJoin('members', 'p', 'p.id = a.professional_id')
      .leftJoin('appointment_services', 'x', 'x.appointment_id = a.id')
      .leftJoin('services', 's', 's.id = x.service_id')
      .where('r.tenant_id = :tenantId', { tenantId })
      .andWhere('a.status = :done', { done: APPOINTMENT_STATUS.DONE })
      .andWhere('a.start_at >= :from AND a.start_at < :to', { from, to })
      .groupBy('r.id')
      .addGroupBy('a.start_at')
      .addGroupBy('a.client_name')
      .addGroupBy('p.name')
      .orderBy('a.start_at', 'ASC')
      .getRawMany<RevenueRow>();
  }
}
