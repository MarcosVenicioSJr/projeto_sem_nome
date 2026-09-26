import { z } from 'zod';
import { isoDateSchema, moneySchema } from '../common/index.js';
import { paymentMethodSchema } from '../agenda/agenda.schema.js';

/** POST /finance/expenses and PATCH /finance/expenses/:id. */
export const createExpenseSchema = z.object({
  description: z.string().trim().min(2, 'validation.name.tooShort').max(200),
  category: z.string().trim().max(60).nullable().optional(),
  amount: moneySchema,
  date: isoDateSchema,
  recurring: z.boolean().default(false),
});
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export const updateExpenseSchema = createExpenseSchema.partial();
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;

export const expenseSchema = z.object({
  id: z.uuid(),
  description: z.string(),
  category: z.string().nullable(),
  amount: z.number(),
  date: isoDateSchema,
  recurring: z.boolean(),
});
export type Expense = z.infer<typeof expenseSchema>;

/** GET /finance/commissions?date= — the day's closing, per professional. */
export const commissionsQuerySchema = z.object({ date: isoDateSchema });
export type CommissionsQuery = z.infer<typeof commissionsQuerySchema>;

export const commissionLineSchema = z.object({
  professionalId: z.uuid(),
  professionalName: z.string(),
  servicesDone: z.number().int(),
  servicesTotal: z.number(),
  commissionRate: z.number().nullable(),
  commission: z.number(),
});
export type CommissionLine = z.infer<typeof commissionLineSchema>;

/** One received payment: what the counter informed when completing an appointment. */
export const revenueLineSchema = z.object({
  id: z.uuid(),
  time: z.iso.datetime(),
  clientName: z.string(),
  professionalName: z.string(),
  services: z.string(),
  amount: z.number(),
  paymentMethod: paymentMethodSchema,
});
export type RevenueLine = z.infer<typeof revenueLineSchema>;
