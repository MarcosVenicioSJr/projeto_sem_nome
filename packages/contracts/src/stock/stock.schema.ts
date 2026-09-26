import { z } from 'zod';
import { nameSchema } from '../user/user.schema.js';

const quantity = z.number().min(0, 'validation.number.invalid');

/** Internal consumables (blade, alcohol, gel...) — not items for sale. */
export const stockItemSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  quantity: z.number(),
  unit: z.string(),
  minQuantity: z.number(),
  lowStock: z.boolean(),
});
export type StockItem = z.infer<typeof stockItemSchema>;

export const createStockItemSchema = z.object({
  name: nameSchema,
  quantity: quantity.default(0),
  unit: z.string().trim().min(1).max(20),
  minQuantity: quantity.default(0),
});
export type CreateStockItemInput = z.infer<typeof createStockItemSchema>;
export const updateStockItemSchema = createStockItemSchema.partial();
export type UpdateStockItemInput = z.infer<typeof updateStockItemSchema>;

/** PATCH /stock-items/:id/quantity — manual adjustment, positive or negative. */
export const adjustQuantitySchema = z.object({
  delta: z.number().refine((n) => n !== 0, 'validation.number.invalid'),
});
export type AdjustQuantityInput = z.infer<typeof adjustQuantitySchema>;
