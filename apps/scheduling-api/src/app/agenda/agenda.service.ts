import { randomBytes } from 'node:crypto';
import { HttpStatus, Injectable } from '@nestjs/common';
import type {
  AccessTokenPayload,
  AgendaQuery,
  Appointment,
  CreateAppointmentInput,
  CreateTimeOffInput,
  MarkDoneInput,
  SetScheduleInput,
  SlotsQuery,
} from '@org/contracts';
import { assertManagerOrSelf, isManagement } from '../common/access';
import { AppException } from '../common/app.exception';
import {
  dayRange,
  localDateOf,
  localMinuteToDate,
  weekdayOf,
} from '../common/tenant-time';
import {
  APPOINTMENT_STATUS,
  AppointmentsRepository,
  MembersRepository,
  ProfessionalAvailabilityRepository,
  ProfessionalServicesRepository,
  ServicesRepository,
  TenantsRepository,
  type AppointmentEntity,
} from '../database';
import {
  CANCEL_WINDOW_MINUTES,
  MIN_LEAD_MINUTES,
  candidateStarts,
  fits,
  freeIntervals,
  violatesDailyLimit,
  type Interval,
} from './availability';

const MS_PER_MINUTE = 60_000;

export const toAppointment = (e: AppointmentEntity): Appointment => ({
  id: e.id,
  professionalId: e.professionalId,
  clientName: e.clientName,
  clientPhone: e.clientPhone,
  startAt: e.startAt.toISOString(),
  endAt: e.endAt.toISOString(),
  status: e.status,
  services: (e.services ?? []).map((s) => ({
    serviceId: s.serviceId,
    price: Number(s.price),
    durationMinutes: s.durationMinutes,
  })),
});

/**
 * Booking rules: notice, availability, daily limit per phone and the
 * cancellation window. The end customer has no account; a booking keeps only
 * their name and phone, and a secret token for the cancellation link.
 */
@Injectable()
export class AgendaService {
  constructor(
    private readonly tenants: TenantsRepository,
    private readonly members: MembersRepository,
    private readonly services: ServicesRepository,
    private readonly professionalServices: ProfessionalServicesRepository,
    private readonly availability: ProfessionalAvailabilityRepository,
    private readonly appointments: AppointmentsRepository,
  ) {}

  // ── public booking flow ─────────────────────────────────────────────

  /** Professionals of the tenant that offer at least one service. */
  async listProfessionals(slug: string) {
    const tenant = await this.tenantBySlug(slug);
    const offered = await this.professionalServices.listByTenant(tenant.id);
    const [members, catalog] = await Promise.all([
      this.members.findManyInTenant(tenant.id, [
        ...new Set(offered.map((o) => o.professionalId)),
      ]),
      this.services.list(tenant.id),
    ]);
    const names = new Map(catalog.map((s) => [s.id, s.name]));
    return members.map((m) => ({
      id: m.id,
      name: m.name,
      services: offered
        .filter((o) => o.professionalId === m.id)
        .map((o) => ({
          serviceId: o.serviceId,
          name: names.get(o.serviceId) ?? '',
          price: Number(o.price),
          durationMinutes: o.durationMinutes,
        })),
    }));
  }

  /** Free start times (ISO) for the chosen services on a day (client rules: 1 h notice). */
  async slots(slug: string, query: SlotsQuery): Promise<string[]> {
    const tenant = await this.tenantBySlug(slug);
    return this.slotsFor(tenant.id, query, true);
  }

  /** Same, for the counter: no notice rule, only times that have not passed. */
  async staffSlots(caller: AccessTokenPayload, query: SlotsQuery) {
    assertManagerOrSelf(caller, query.professionalId);
    return this.slotsFor(caller.tenantId, query, false);
  }

  private async slotsFor(
    tenantId: string,
    query: SlotsQuery,
    clientRules: boolean,
  ): Promise<string[]> {
    await this.professionalOrFail(tenantId, query.professionalId);
    const offered = await this.offeredServices(
      tenantId,
      query.professionalId,
      query.serviceIds,
    );
    const duration = offered.reduce((sum, o) => sum + o.durationMinutes, 0);
    const free = await this.freeTime(query.professionalId, query.date);
    const earliest =
      Date.now() + (clientRules ? MIN_LEAD_MINUTES * MS_PER_MINUTE : 0);
    return candidateStarts(free, duration)
      .map((minute) => localMinuteToDate(query.date, minute))
      .filter((start) => start.getTime() >= earliest)
      .map((start) => start.toISOString());
  }

  /** Public booking by the end customer: all client rules apply. */
  async book(slug: string, input: CreateAppointmentInput) {
    const tenant = await this.tenantBySlug(slug);
    return this.createBooking(tenant.id, input, true);
  }

  /**
   * Booking made at the counter by staff: same availability, but no 1 h
   * notice and no daily-limit per phone (those protect against the public).
   */
  async staffBook(caller: AccessTokenPayload, input: CreateAppointmentInput) {
    assertManagerOrSelf(caller, input.professionalId);
    return this.createBooking(caller.tenantId, input, false);
  }

  private async createBooking(
    tenantId: string,
    input: CreateAppointmentInput,
    clientRules: boolean,
  ) {
    const tenant = { id: tenantId };
    await this.professionalOrFail(tenant.id, input.professionalId);
    const offered = await this.offeredServices(
      tenant.id,
      input.professionalId,
      input.serviceIds,
    );

    const startAt = new Date(input.startAt);
    const duration = offered.reduce((sum, o) => sum + o.durationMinutes, 0);
    const endAt = new Date(startAt.getTime() + duration * MS_PER_MINUTE);

    if (
      clientRules &&
      startAt.getTime() < Date.now() + MIN_LEAD_MINUTES * MS_PER_MINUTE
    ) {
      throw new AppException('errors.agenda.leadTime', HttpStatus.UNPROCESSABLE_ENTITY);
    }

    const date = localDateOf(startAt);
    const { from, to } = dayRange(date);
    const sameDay = await this.appointments.listActiveByPhone(
      tenant.id,
      input.clientPhone,
      from,
      to,
    );
    if (
      clientRules &&
      violatesDailyLimit(sameDay, {
        professionalId: input.professionalId,
        startAt,
        endAt,
      })
    ) {
      throw new AppException('errors.agenda.dailyLimit', HttpStatus.CONFLICT);
    }

    const free = await this.freeTime(input.professionalId, date);
    const startMinute = (startAt.getTime() - from.getTime()) / MS_PER_MINUTE;
    if (!fits(free, startMinute, startMinute + duration)) {
      throw new AppException('errors.agenda.slotUnavailable', HttpStatus.CONFLICT);
    }

    const appointment = await this.appointments.createWithServices(
      {
        tenantId: tenant.id,
        professionalId: input.professionalId,
        clientName: input.clientName,
        clientPhone: input.clientPhone,
        startAt,
        endAt,
        cancelToken: randomBytes(24).toString('base64url'),
      },
      offered.map((o) => ({
        serviceId: o.serviceId,
        price: o.price,
        durationMinutes: o.durationMinutes,
      })),
    );
    return {
      ...toAppointment(appointment),
      cancelToken: appointment.cancelToken,
      cancelPath: `/agenda/cancel/${appointment.cancelToken}`,
    };
  }

  /** The client cancels through the link, up to 2 hours before the start. */
  async cancelByToken(token: string) {
    const appointment = await this.appointments.findByCancelToken(token);
    if (!appointment) {
      throw new AppException('errors.agenda.notFound', HttpStatus.NOT_FOUND);
    }
    this.assertConfirmed(appointment);
    const limit =
      appointment.startAt.getTime() - CANCEL_WINDOW_MINUTES * MS_PER_MINUTE;
    if (Date.now() > limit) {
      throw new AppException('errors.agenda.cancelWindowClosed', HttpStatus.CONFLICT);
    }
    await this.appointments.cancel(appointment.id);
    return toAppointment({ ...appointment, status: APPOINTMENT_STATUS.CANCELLED });
  }

  // ── staff agenda ────────────────────────────────────────────────────

  async listDay(caller: AccessTokenPayload, query: AgendaQuery) {
    if (query.professionalId) assertManagerOrSelf(caller, query.professionalId);
    const professionalId = isManagement(caller)
      ? query.professionalId
      : caller.sub;
    const { from, to } = dayRange(query.date);
    const rows = await this.appointments.listInRange(
      caller.tenantId,
      from,
      to,
      professionalId,
    );
    return rows.map(toAppointment);
  }

  /** Completes the booking and records what was received (revenue). */
  async markDone(caller: AccessTokenPayload, id: string, input: MarkDoneInput) {
    const appointment = await this.staffAppointment(caller, id);
    this.assertConfirmed(appointment);
    await this.appointments.complete(appointment, {
      amount: String(input.amount),
      paymentMethod: input.paymentMethod,
      recordedById: caller.sub,
    });
    return toAppointment(await this.staffAppointment(caller, id));
  }

  /** Cancellation at the counter (no time window) — also how a no-show is handled. */
  async staffCancel(caller: AccessTokenPayload, id: string) {
    const appointment = await this.staffAppointment(caller, id);
    this.assertConfirmed(appointment);
    await this.appointments.cancel(id);
    return toAppointment(await this.staffAppointment(caller, id));
  }

  // ── weekly hours and time off ───────────────────────────────────────

  async getSchedule(caller: AccessTokenPayload, professionalId: string) {
    await this.authorize(caller, professionalId);
    return (await this.availability.week(professionalId)).map((d) => ({
      weekday: d.weekday,
      startMinute: d.startMinute,
      endMinute: d.endMinute,
      breakStartMinute: d.breakStartMinute,
      breakEndMinute: d.breakEndMinute,
    }));
  }

  async setSchedule(
    caller: AccessTokenPayload,
    professionalId: string,
    input: SetScheduleInput,
  ) {
    await this.authorize(caller, professionalId);
    await this.availability.replaceWeek(
      caller.tenantId,
      professionalId,
      input.days.map((d) => ({
        weekday: d.weekday,
        startMinute: d.startMinute,
        endMinute: d.endMinute,
        breakStartMinute: d.breakStartMinute ?? null,
        breakEndMinute: d.breakEndMinute ?? null,
      })),
    );
    return this.getSchedule(caller, professionalId);
  }

  async listTimeOff(caller: AccessTokenPayload, professionalId: string) {
    await this.authorize(caller, professionalId);
    return (await this.availability.listTimeOff(caller.tenantId, professionalId)).map(
      (t) => ({
        id: t.id,
        date: t.date,
        startMinute: t.startMinute,
        endMinute: t.endMinute,
      }),
    );
  }

  async createTimeOff(
    caller: AccessTokenPayload,
    professionalId: string,
    input: CreateTimeOffInput,
  ) {
    await this.authorize(caller, professionalId);
    const t = await this.availability.createTimeOff({
      tenantId: caller.tenantId,
      professionalId,
      date: input.date,
      startMinute: input.startMinute ?? null,
      endMinute: input.endMinute ?? null,
    });
    return { id: t.id, date: t.date, startMinute: t.startMinute, endMinute: t.endMinute };
  }

  async deleteTimeOff(
    caller: AccessTokenPayload,
    professionalId: string,
    id: string,
  ): Promise<void> {
    await this.authorize(caller, professionalId);
    if (!(await this.availability.deleteTimeOff(caller.tenantId, professionalId, id))) {
      throw new AppException('errors.agenda.notFound', HttpStatus.NOT_FOUND);
    }
  }

  // ── helpers ─────────────────────────────────────────────────────────

  /** Working hours of the day minus break, time off and bookings (local minutes). */
  private async freeTime(professionalId: string, date: string): Promise<Interval[]> {
    const hours = await this.availability.dayOfWeek(professionalId, weekdayOf(date));
    if (!hours) return [];
    const timeOff = await this.availability.timeOffOn(professionalId, date);
    if (timeOff.some((t) => t.startMinute === null || t.endMinute === null)) {
      return [];
    }
    const { from, to } = dayRange(date);
    const booked = await this.appointments.listActiveOverlapping(professionalId, from, to);

    const busy: Interval[] = [
      ...timeOff.map((t) => ({ start: t.startMinute as number, end: t.endMinute as number })),
      ...booked.map((a) => ({
        start: (a.startAt.getTime() - from.getTime()) / MS_PER_MINUTE,
        end: (a.endAt.getTime() - from.getTime()) / MS_PER_MINUTE,
      })),
    ];
    if (hours.breakStartMinute !== null && hours.breakEndMinute !== null) {
      busy.push({ start: hours.breakStartMinute, end: hours.breakEndMinute });
    }
    return freeIntervals({ start: hours.startMinute, end: hours.endMinute }, busy);
  }

  /** The requested services, as offered by the professional (price/duration frozen). */
  private async offeredServices(
    tenantId: string,
    professionalId: string,
    serviceIds: string[],
  ) {
    const unique = [...new Set(serviceIds)];
    const offered = await this.professionalServices.findMany(
      tenantId,
      professionalId,
      unique,
    );
    if (offered.length !== unique.length) {
      throw new AppException(
        'errors.agenda.serviceNotOffered',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
    return offered;
  }

  private async staffAppointment(caller: AccessTokenPayload, id: string) {
    const appointment = await this.appointments.find(caller.tenantId, id);
    if (!appointment) {
      throw new AppException('errors.agenda.notFound', HttpStatus.NOT_FOUND);
    }
    assertManagerOrSelf(caller, appointment.professionalId);
    return appointment;
  }

  private assertConfirmed(appointment: AppointmentEntity): void {
    if (appointment.status !== APPOINTMENT_STATUS.CONFIRMED) {
      throw new AppException('errors.agenda.notConfirmed', HttpStatus.CONFLICT);
    }
  }

  private async authorize(caller: AccessTokenPayload, professionalId: string) {
    assertManagerOrSelf(caller, professionalId);
    await this.professionalOrFail(caller.tenantId, professionalId);
  }

  private async professionalOrFail(tenantId: string, professionalId: string) {
    const professional = await this.members.findInTenant(tenantId, professionalId);
    if (!professional) {
      throw new AppException(
        'errors.agenda.professionalNotFound',
        HttpStatus.NOT_FOUND,
      );
    }
    return professional;
  }

  private async tenantBySlug(slug: string) {
    const tenant = await this.tenants.findBySlug(slug);
    if (!tenant) {
      throw new AppException('errors.tenant.notFound', HttpStatus.NOT_FOUND);
    }
    return tenant;
  }
}
