import type { Member } from '@org/contracts';
import type { MemberEntity } from '../database';

/**
 * DB entity -> contract output shape (@org/contracts). Never exposes
 * `passwordHash`.
 */
export function toMember(e: MemberEntity): Member {
  const base = {
    id: e.id,
    tenantId: e.tenantId,
    name: e.name,
    email: e.email,
    phone: e.phone,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  };
  if (e.role === 'owner') return { ...base, role: 'owner' };
  if (e.role === 'manager') return { ...base, role: 'manager' };
  return {
    ...base,
    role: 'employee',
    commissionRate: e.commissionRate === null ? null : Number(e.commissionRate),
  };
}
