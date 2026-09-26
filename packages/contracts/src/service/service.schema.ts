import { z } from 'zod';
import { moneySchema } from '../common/index.js';
import { nameSchema } from '../user/user.schema.js';

/** A service the tenant offers. Just a name: price and duration are set per professional. */
export const serviceSchema = z.object({
  id: z.uuid(),
  name: z.string(),
});
export type Service = z.infer<typeof serviceSchema>;

/** POST /services and PATCH /services/:id. */
export const createServiceSchema = z.object({ name: nameSchema });
export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export const updateServiceSchema = createServiceSchema.partial();
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;

/** A service a professional performs, with their own price and duration. */
export const professionalServiceSchema = z.object({
  id: z.uuid(),
  professionalId: z.uuid(),
  serviceId: z.uuid(),
  price: z.number(),
  durationMinutes: z.number().int(),
});
export type ProfessionalService = z.infer<typeof professionalServiceSchema>;

/** PUT /members/:professionalId/services — upserts one service of the professional. */
export const upsertProfessionalServiceSchema = z.object({
  serviceId: z.uuid(),
  price: moneySchema,
  durationMinutes: z
    .number()
    .int('validation.number.invalid')
    .min(5, 'validation.number.invalid')
    .max(720, 'validation.number.invalid'),
});
export type UpsertProfessionalServiceInput = z.infer<
  typeof upsertProfessionalServiceSchema
>;

/** Route params for `/members/:professionalId/services/:serviceId`. */
export const professionalServiceParamSchema = z.object({
  professionalId: z.uuid(),
  serviceId: z.uuid(),
});
export const professionalParamSchema = z.object({ professionalId: z.uuid() });
export type ProfessionalParam = z.infer<typeof professionalParamSchema>;
