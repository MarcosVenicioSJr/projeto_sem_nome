import { ROLE } from '@org/contracts';

/**
 * Roles of a tenant-bound account (`members` table). A subset of the
 * contracts' `ROLE` (the `client` lives in its own table), derived from it so
 * the values never drift.
 */
export const MEMBER_ROLE = {
  OWNER: ROLE.OWNER,
  EMPLOYEE: ROLE.EMPLOYEE,
} as const;

export type MemberRole = (typeof MEMBER_ROLE)[keyof typeof MEMBER_ROLE];

/** Postgres enum type name and values, for the `role` column. */
export const MEMBER_ROLE_ENUM_NAME = 'member_role';
export const MEMBER_ROLE_VALUES = Object.values(MEMBER_ROLE);
