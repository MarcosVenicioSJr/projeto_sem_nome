import { describe, expect, it } from 'vitest';
import { registerSchema } from '../auth/register.schema.js';
import { loginSchema } from '../auth/login.schema.js';
import { createTenantSchema, slugSchema } from '../tenant/tenant.schema.js';
import { passwordSchema, phoneSchema } from '../common/index.js';
import { meSchema, roleSchema } from './user.schema.js';
import { accessTokenPayloadSchema } from '../auth/token.schema.js';

const validRegister = {
  name: 'Helena Cardoso',
  email: '  Helena@Gmail.com ',
  phone: '11987654321',
  password: 'Abcd1234',
};

describe('registerSchema', () => {
  it('normalizes email', () => {
    expect(registerSchema.parse(validRegister).email).toBe('helena@gmail.com');
  });

  it('emits i18n keys, not prose, as issue messages', () => {
    const result = registerSchema.safeParse({ ...validRegister, password: 'short' });
    expect(result.success).toBe(false);
    const messages = result.error!.issues.map((i) => i.message);
    expect(messages).toContain('validation.password.minLength');
  });

  it('does not accept a role from the client', () => {
    const parsed = registerSchema.parse({ ...validRegister, role: 'owner' });
    expect(parsed).not.toHaveProperty('role');
  });
});

describe('loginSchema', () => {
  it('uses email and only requires a non-empty password', () => {
    expect(loginSchema.safeParse({ email: 'a@b.co', password: 'x' }).success).toBe(true);
    expect(loginSchema.safeParse({ email: 'a@b.co', password: '' }).success).toBe(false);
  });
});

describe('roleSchema', () => {
  it('only allows client, owner and employee', () => {
    expect(roleSchema.safeParse('client').success).toBe(true);
    expect(roleSchema.safeParse('owner').success).toBe(true);
    expect(roleSchema.safeParse('employee').success).toBe(true);
    expect(roleSchema.safeParse('admin').success).toBe(false);
  });
});

describe('slugSchema', () => {
  it('normalizes and accepts kebab-case', () => {
    expect(slugSchema.parse(' Clinica-Sorriso ')).toBe('clinica-sorriso');
  });

  it.each(['ab', '-clinic', 'clinic-', 'cli nic', 'cli--nic'])('rejects %s', (bad) => {
    expect(slugSchema.safeParse(bad).success).toBe(false);
  });
});

describe('createTenantSchema', () => {
  it('validates company and owner together', () => {
    const result = createTenantSchema.safeParse({
      tenant: { name: 'Clínica Sorriso', slug: 'clinica-sorriso' },
      owner: { ...validRegister },
    });
    expect(result.success).toBe(true);
  });
});

describe('phoneSchema', () => {
  it('requires 11 digits', () => {
    expect(phoneSchema.safeParse('11987654321').success).toBe(true);
    expect(phoneSchema.safeParse('1198765432').success).toBe(false);
    expect(phoneSchema.safeParse('(11)98765432').success).toBe(false);
  });
});

describe('passwordSchema', () => {
  it('requires upper, lower, number and 8+ chars', () => {
    expect(passwordSchema.safeParse('abcdefgh').success).toBe(false);
    expect(passwordSchema.safeParse('Abcd1234').success).toBe(true);
  });
});

describe('accessTokenPayloadSchema', () => {
  const base = { sub: '11111111-1111-4111-8111-111111111111', name: 'A B' };

  it.each(['owner', 'employee'])('requires tenantId for %s', (role) => {
    expect(accessTokenPayloadSchema.safeParse({ ...base, role }).success).toBe(false);
    expect(
      accessTokenPayloadSchema.safeParse({
        ...base,
        role,
        tenantId: '22222222-2222-4222-8222-222222222222',
      }).success,
    ).toBe(true);
  });

  it('a client token has no tenant', () => {
    const parsed = accessTokenPayloadSchema.parse({ ...base, role: 'client' });
    expect(parsed).not.toHaveProperty('tenantId');
  });
});

describe('meSchema', () => {
  it('discriminates by role', () => {
    const account = {
      id: '11111111-1111-4111-8111-111111111111',
      name: 'A B',
      phone: '11987654321',
      email: 'a@b.co',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    expect(meSchema.safeParse({ ...account, role: 'client' }).success).toBe(true);
    expect(meSchema.safeParse({ ...account, role: 'owner' }).success).toBe(false);
    expect(meSchema.safeParse({ ...account, role: 'employee' }).success).toBe(false);
  });
});
