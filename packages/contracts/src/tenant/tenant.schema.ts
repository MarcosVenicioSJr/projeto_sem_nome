import { z } from 'zod';
import { emailSchema, passwordSchema, phoneSchema } from '../common/index.js';
import { nameSchema, updateProfileSchema } from '../user/user.schema.js';

/** URL-safe company identifier used in `/t/:slug/...` routes. */
export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, 'validation.slug.format')
  .max(60, 'validation.slug.format')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'validation.slug.format');
export type Slug = z.infer<typeof slugSchema>;

export const tenantSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: slugSchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type Tenant = z.infer<typeof tenantSchema>;

/** POST /tenants — onboarding: creates the company and its owner. */
export const createTenantSchema = z.object({
  tenant: z.object({
    name: nameSchema,
    slug: slugSchema,
  }),
  owner: z.object({
    name: nameSchema,
    email: emailSchema,
    phone: phoneSchema,
    password: passwordSchema,
  }),
});
export type CreateTenantInput = z.infer<typeof createTenantSchema>;

/** POST /members/employees — the owner registers an employee (or manager) with an initial password. */
export const createEmployeeSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
  role: z.enum(['employee', 'manager']).default('employee'),
  commissionRate: z.number().min(0).max(100).nullable().optional(),
});
export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;

/** PATCH /members/employees/:id — profile fields plus the commission rate. */
export const updateEmployeeSchema = updateProfileSchema.extend({
  commissionRate: z.number().min(0).max(100).nullable().optional(),
});
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;

/** Route param for `/members/employees/:id`. */
export const employeeIdParamSchema = z.object({ id: z.uuid() });
export type EmployeeIdParam = z.infer<typeof employeeIdParamSchema>;

/** Route param for `/t/:slug/...`. */
export const tenantSlugParamSchema = z.object({ slug: slugSchema });
export type TenantSlugParam = z.infer<typeof tenantSlugParamSchema>;
