import { z } from 'zod';
import { emailSchema, phoneSchema } from '../common/index.js';

/**
 * Account type. `owner` runs a tenant (clinic) and belongs to exactly one;
 * `employee` also belongs to one tenant, created by the owner, with access
 * restricted to the schedule; `client` is a global account that books
 * appointments and gets linked to tenants through the booking link.
 */
export const ROLE = {
  CLIENT: 'client',
  OWNER: 'owner',
  EMPLOYEE: 'employee',
} as const;
export const roleSchema = z.enum([ROLE.CLIENT, ROLE.OWNER, ROLE.EMPLOYEE]);
export type Role = z.infer<typeof roleSchema>;

export const nameSchema = z
  .string()
  .trim()
  .min(2, 'validation.name.tooShort')
  .max(120, 'validation.string.tooLong');

const accountFields = {
  id: z.uuid(),
  name: z.string(),
  phone: phoneSchema,
  email: emailSchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
};

export const ownerSchema = z.object({
  ...accountFields,
  role: z.literal(ROLE.OWNER),
  tenantId: z.uuid(),
});
export type Owner = z.infer<typeof ownerSchema>;

export const employeeSchema = z.object({
  ...accountFields,
  role: z.literal(ROLE.EMPLOYEE),
  tenantId: z.uuid(),
});
export type Employee = z.infer<typeof employeeSchema>;

/** A tenant-bound account: the owner or one of their employees. */
export const memberSchema = z.discriminatedUnion('role', [
  ownerSchema,
  employeeSchema,
]);
export type Member = z.infer<typeof memberSchema>;

export const clientSchema = z.object({
  ...accountFields,
  role: z.literal(ROLE.CLIENT),
});
export type Client = z.infer<typeof clientSchema>;

/** Response of GET /user/me: the caller's own account, by role. */
export const meSchema = z.discriminatedUnion('role', [
  ownerSchema,
  employeeSchema,
  clientSchema,
]);
export type Me = z.infer<typeof meSchema>;

export const updateProfileSchema = z
  .object({
    name: nameSchema,
    phone: phoneSchema,
    email: emailSchema,
  })
  .partial();
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
