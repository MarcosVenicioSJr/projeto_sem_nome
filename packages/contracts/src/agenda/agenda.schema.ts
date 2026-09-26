import { z } from 'zod';
import {
  isoDateSchema,
  minuteOfDaySchema,
  moneySchema,
  phoneSchema,
} from '../common/index.js';
import { nameSchema } from '../user/user.schema.js';

export const APPOINTMENT_STATUS = {
  CONFIRMED: 'confirmed',
  DONE: 'done',
  CANCELLED: 'cancelled',
} as const;
export const appointmentStatusSchema = z.enum([
  APPOINTMENT_STATUS.CONFIRMED,
  APPOINTMENT_STATUS.DONE,
  APPOINTMENT_STATUS.CANCELLED,
]);
export type AppointmentStatus = z.infer<typeof appointmentStatusSchema>;

export const PAYMENT_METHOD = {
  CASH: 'cash',
  PIX: 'pix',
  DEBIT: 'debit',
  CREDIT: 'credit',
} as const;
export const paymentMethodSchema = z.enum([
  PAYMENT_METHOD.CASH,
  PAYMENT_METHOD.PIX,
  PAYMENT_METHOD.DEBIT,
  PAYMENT_METHOD.CREDIT,
]);
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;

export const appointmentSchema = z.object({
  id: z.uuid(),
  professionalId: z.uuid(),
  clientName: z.string(),
  clientPhone: z.string(),
  startAt: z.iso.datetime(),
  endAt: z.iso.datetime(),
  status: appointmentStatusSchema,
  services: z.array(
    z.object({
      serviceId: z.uuid(),
      price: z.number(),
      durationMinutes: z.number().int(),
    }),
  ),
});
export type Appointment = z.infer<typeof appointmentSchema>;

/** POST /t/:slug/agenda/appointments — public: the client has no account. */
export const createAppointmentSchema = z.object({
  professionalId: z.uuid(),
  serviceIds: z.array(z.uuid()).min(1, 'validation.array.min').max(10),
  clientName: nameSchema,
  clientPhone: phoneSchema,
  startAt: z.iso.datetime(),
});
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;

/** GET /t/:slug/agenda/slots?professionalId=&date=&serviceIds=a,b */
export const slotsQuerySchema = z.object({
  professionalId: z.uuid(),
  date: isoDateSchema,
  serviceIds: z
    .string()
    .transform((v) => v.split(',').filter(Boolean))
    .pipe(z.array(z.uuid()).min(1, 'validation.array.min').max(10)),
});
export type SlotsQuery = z.infer<typeof slotsQuerySchema>;

/** GET /agenda?date=&professionalId= */
export const agendaQuerySchema = z.object({
  date: isoDateSchema,
  professionalId: z.uuid().optional(),
});
export type AgendaQuery = z.infer<typeof agendaQuerySchema>;

/** PATCH /agenda/:id/done — what was received and how. */
export const markDoneSchema = z.object({
  amount: moneySchema,
  paymentMethod: paymentMethodSchema,
});
export type MarkDoneInput = z.infer<typeof markDoneSchema>;

/** Route param `/agenda/cancel/:token` (cancellation link sent to the client). */
export const cancelTokenParamSchema = z.object({
  token: z.string().min(16).max(128),
});

/** One weekday of a professional's weekly hours. Missing weekday = day off. */
export const scheduleDaySchema = z
  .object({
    weekday: z.number().int().min(0).max(6),
    startMinute: minuteOfDaySchema,
    endMinute: minuteOfDaySchema,
    breakStartMinute: minuteOfDaySchema.nullable().optional(),
    breakEndMinute: minuteOfDaySchema.nullable().optional(),
  })
  .refine((d) => d.startMinute < d.endMinute, 'validation.schedule.range');
export type ScheduleDay = z.infer<typeof scheduleDaySchema>;

/** PUT /members/:professionalId/schedule — replaces the whole week. */
export const setScheduleSchema = z.object({
  days: z.array(scheduleDaySchema).max(7),
});
export type SetScheduleInput = z.infer<typeof setScheduleSchema>;

/** POST /members/:professionalId/time-off — a day off, or a window inside a day. */
export const createTimeOffSchema = z
  .object({
    date: isoDateSchema,
    startMinute: minuteOfDaySchema.nullable().optional(),
    endMinute: minuteOfDaySchema.nullable().optional(),
  })
  .refine(
    (d) =>
      (d.startMinute == null && d.endMinute == null) ||
      (d.startMinute != null &&
        d.endMinute != null &&
        d.startMinute < d.endMinute),
    'validation.schedule.range',
  );
export type CreateTimeOffInput = z.infer<typeof createTimeOffSchema>;
