import { describe, expect, it } from 'vitest';
import {
  createAppointmentSchema,
  slotsQuerySchema,
} from '../agenda/agenda.schema.js';
import { loginSchema } from '../auth/login.schema.js';
import {
  createEmployeeSchema,
  createTenantSchema,
  slugSchema,
} from '../tenant/tenant.schema.js';
import { passwordSchema, phoneSchema } from '../common/index.js';
import { meSchema, roleSchema } from './user.schema.js';
import { accessTokenPayloadSchema } from '../auth/token.schema.js';

const validRegister = {
  name: 'Helena Cardoso',
  email: '  Helena@Gmail.com ',
  phone: '11987654321',
  password: 'Abcd1234',
};

describe('createEmployeeSchema', () => {
  it('normalizes email and defaults the role to employee', () => {
    const parsed = createEmployeeSchema.parse(validRegister);
    expect(parsed.email).toBe('helena@gmail.com');
    expect(parsed.role).toBe('employee');
  });

  it('emits i18n keys, not prose, as issue messages', () => {
    const result = createEmployeeSchema.safeParse({
      ...validRegister,
      password: 'short',
    });
    expect(result.success).toBe(false);
    const messages = (result.error?.issues ?? []).map(
      (i: { message: string }) => i.message,
    );
    expect(messages).toContain('validation.password.minLength');
  });

  it('only lets an employee or a manager be created, never an owner', () => {
    expect(
      createEmployeeSchema.safeParse({ ...validRegister, role: 'manager' })
        .success,
    ).toBe(true);
    expect(
      createEmployeeSchema.safeParse({ ...validRegister, role: 'owner' })
        .success,
    ).toBe(false);
  });
});

describe('loginSchema', () => {
  it('uses email and only requires a non-empty password', () => {
    expect(
      loginSchema.safeParse({ email: 'a@b.co', password: 'x' }).success,
    ).toBe(true);
    expect(
      loginSchema.safeParse({ email: 'a@b.co', password: '' }).success,
    ).toBe(false);
  });
});

describe('roleSchema', () => {
  it('only allows owner, manager and employee', () => {
    expect(roleSchema.safeParse('owner').success).toBe(true);
    expect(roleSchema.safeParse('manager').success).toBe(true);
    expect(roleSchema.safeParse('employee').success).toBe(true);
    expect(roleSchema.safeParse('client').success).toBe(false);
    expect(roleSchema.safeParse('admin').success).toBe(false);
  });
});

describe('slugSchema', () => {
  it('normalizes and accepts kebab-case', () => {
    expect(slugSchema.parse(' Clinica-Sorriso ')).toBe('clinica-sorriso');
  });

  it.each(['ab', '-clinic', 'clinic-', 'cli nic', 'cli--nic'])(
    'rejects %s',
    (bad) => {
      expect(slugSchema.safeParse(bad).success).toBe(false);
    },
  );
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

  it.each(['owner', 'manager', 'employee'])(
    'requires tenantId for %s',
    (role) => {
      expect(
        accessTokenPayloadSchema.safeParse({ ...base, role }).success,
      ).toBe(false);
      expect(
        accessTokenPayloadSchema.safeParse({
          ...base,
          role,
          tenantId: '22222222-2222-4222-8222-222222222222',
        }).success,
      ).toBe(true);
    },
  );

  it('has no client role: end customers have no account', () => {
    expect(
      accessTokenPayloadSchema.safeParse({
        ...base,
        role: 'client',
        tenantId: '22222222-2222-4222-8222-222222222222',
      }).success,
    ).toBe(false);
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
    const tenantId = '22222222-2222-4222-8222-222222222222';
    expect(
      meSchema.safeParse({ ...account, role: 'owner', tenantId }).success,
    ).toBe(true);
    expect(
      meSchema.safeParse({ ...account, role: 'manager', tenantId }).success,
    ).toBe(true);
    expect(
      meSchema.safeParse({
        ...account,
        role: 'employee',
        tenantId,
        commissionRate: null,
      }).success,
    ).toBe(true);
    expect(meSchema.safeParse({ ...account, role: 'owner' }).success).toBe(
      false,
    );
    expect(meSchema.safeParse({ ...account, role: 'client' }).success).toBe(
      false,
    );
  });
});

describe('createAppointmentSchema', () => {
  const body = {
    professionalId: '11111111-1111-4111-8111-111111111111',
    serviceIds: ['22222222-2222-4222-8222-222222222222'],
    clientName: 'Helena Cardoso',
    clientPhone: '11987654321',
    startAt: '2026-09-28T13:00:00.000Z',
  };

  it('needs only a name and a phone from the client — no account', () => {
    expect(createAppointmentSchema.safeParse(body).success).toBe(true);
  });

  it('requires at least one service', () => {
    expect(
      createAppointmentSchema.safeParse({ ...body, serviceIds: [] }).success,
    ).toBe(false);
  });
});

describe('slotsQuerySchema', () => {
  it('splits a comma-separated serviceIds list', () => {
    const parsed = slotsQuerySchema.parse({
      professionalId: '11111111-1111-4111-8111-111111111111',
      date: '2026-09-28',
      serviceIds:
        '22222222-2222-4222-8222-222222222222,33333333-3333-4333-8333-333333333333',
    });
    expect(parsed.serviceIds).toHaveLength(2);
  });
});
