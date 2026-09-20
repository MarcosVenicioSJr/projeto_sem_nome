import type { Client, Member } from '@org/contracts';
import type { ClientEntity, MemberEntity } from '../database';

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
  return e.role === 'owner'
    ? { ...base, role: 'owner' }
    : { ...base, role: 'employee' };
}

export function toClient(e: ClientEntity): Client {
  return {
    id: e.id,
    role: 'client',
    name: e.name,
    email: e.email,
    phone: e.phone,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  };
}
