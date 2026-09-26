import { PAYMENT_METHOD } from '@org/contracts';

export { PAYMENT_METHOD };
export type PaymentMethod = (typeof PAYMENT_METHOD)[keyof typeof PAYMENT_METHOD];

/** Postgres enum type name and values, for the `payment_method` column. */
export const PAYMENT_METHOD_ENUM_NAME = 'payment_method';
export const PAYMENT_METHOD_VALUES = Object.values(PAYMENT_METHOD);
