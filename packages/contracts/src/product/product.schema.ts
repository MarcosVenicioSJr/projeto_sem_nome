import { z } from 'zod';
import { moneySchema } from '../common/index.js';
import { nameSchema } from '../user/user.schema.js';

/** An item the tenant sells, with its own quantity in stock. */
export const productSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  category: z.string().nullable(),
  price: z.number(),
  cost: z.number(),
  quantity: z.number(),
});
export type Product = z.infer<typeof productSchema>;

export const createProductSchema = z.object({
  name: nameSchema,
  category: z.string().trim().max(60).nullable().optional(),
  price: moneySchema,
  cost: moneySchema.default(0),
  quantity: z.number().min(0, 'validation.number.invalid').default(0),
});
export type CreateProductInput = z.infer<typeof createProductSchema>;
export const updateProductSchema = createProductSchema.partial();
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
