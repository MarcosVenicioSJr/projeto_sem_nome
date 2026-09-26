import { z } from 'zod';
import { emailSchema, phoneSchema } from '../common/index.js';

/**
 * Account type. Every account belongs to exactly one tenant. `owner` runs it;
 * `manager` has the owner's permissions (finer rules come later); `employee`
 * is a professional who provides services, with restricted access. End
 * customers have no account: appointments only store their name and phone.
 */
export const ROLE = {
  OWNER: 'owner',
  MANAGER: 'manager',
  EMPLOYEE: 'employee',
} as const;
export const roleSchema = z.enum([ROLE.OWNER, ROLE.MANAGER, ROLE.EMPLOYEE]);
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

export const managerSchema = z.object({
  ...accountFields,
  role: z.literal(ROLE.MANAGER),
  tenantId: z.uuid(),
});
export type Manager = z.infer<typeof managerSchema>;

export const employeeSchema = z.object({
  ...accountFields,
  role: z.literal(ROLE.EMPLOYEE),
  tenantId: z.uuid(),
  /** Commission (%) over the services done; set by the owner/manager. */
  commissionRate: z.number().min(0).max(100).nullable(),
});
export type Employee = z.infer<typeof employeeSchema>;

/** A tenant-bound account: the owner, a manager or an employee. */
export const memberSchema = z.discriminatedUnion('role', [
  ownerSchema,
  managerSchema,
  employeeSchema,
]);
export type Member = z.infer<typeof memberSchema>;

/** Response of GET /user/me: the caller's own account. */
export const meSchema = memberSchema;
export type Me = Member;

export const updateProfileSchema = z
  .object({
    name: nameSchema,
    phone: phoneSchema,
    email: emailSchema,
  })
  .partial();
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
