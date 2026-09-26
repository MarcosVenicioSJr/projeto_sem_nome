import { APPOINTMENT_STATUS } from '@org/contracts';

export { APPOINTMENT_STATUS };
export type AppointmentStatus =
  (typeof APPOINTMENT_STATUS)[keyof typeof APPOINTMENT_STATUS];

/** Postgres enum type name and values, for the `status` column. */
export const APPOINTMENT_STATUS_ENUM_NAME = 'appointment_status';
export const APPOINTMENT_STATUS_VALUES = Object.values(APPOINTMENT_STATUS);
