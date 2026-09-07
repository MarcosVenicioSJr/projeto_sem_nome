import { describe, expect, it } from 'vitest';
import { registerSchema } from '../auth/register.schema.js';
import { acceptTermsSchema } from '../auth/accept-terms.schema.js';
import {
  passwordSchema,
  favoriteGenresSchema,
  usernameSchema,
} from '../common/index.js';

const validRegister = {
  name: 'Helena Cardoso',
  username: 'HelenaCardoso',
  email: '  Helena@Gmail.com ',
  password: 'Abcd1234',
  birthDate: '1988-03-14',
};

describe('registerSchema', () => {
  it('normalizes username and email', () => {
    const parsed = registerSchema.parse(validRegister);
    expect(parsed.username).toBe('helenacardoso');
    expect(parsed.email).toBe('helena@gmail.com');
  });

  it('rejects someone under 18', () => {
    const seventeen = new Date();
    seventeen.setFullYear(seventeen.getFullYear() - 17);
    const result = registerSchema.safeParse({
      ...validRegister,
      birthDate: seventeen.toISOString().slice(0, 10),
    });
    expect(result.success).toBe(false);
  });

  it('emits i18n keys, not prose, as issue messages', () => {
    const result = registerSchema.safeParse({ ...validRegister, password: 'short' });
    expect(result.success).toBe(false);
    const messages = result.error!.issues.map((i) => i.message);
    expect(messages).toContain('validation.password.minLength');
  });
});

describe('usernameSchema (Security spec §2.2)', () => {
  it('accepts letters/digits/./_ starting with a letter', () => {
    expect(usernameSchema.parse('Helena.Cardoso_1')).toBe('helena.cardoso_1');
  });

  it.each(['1ana', '_ana', '.ana', 'ana.', 'ma..ria', 'ab'])(
    'rejects %s',
    (bad) => {
      expect(usernameSchema.safeParse(bad).success).toBe(false);
    },
  );
});

describe('acceptTermsSchema (LGPD §3)', () => {
  it('defaults granular consents to false and requires the terms checkbox', () => {
    const parsed = acceptTermsSchema.parse({
      registrationId: '00000000-0000-4000-8000-000000000000',
      termsVersion: '2026-01-01',
      acceptedTerms: true,
    });
    expect(parsed.consentRecommendations).toBe(false);
    expect(parsed.consentMarketing).toBe(false);

    expect(
      acceptTermsSchema.safeParse({
        registrationId: '00000000-0000-4000-8000-000000000000',
        termsVersion: '2026-01-01',
        acceptedTerms: false,
      }).success,
    ).toBe(false);
  });
});

describe('passwordSchema', () => {
  it('requires upper, lower, number and 8+ chars', () => {
    expect(passwordSchema.safeParse('abcdefgh').success).toBe(false);
    expect(passwordSchema.safeParse('Abcd1234').success).toBe(true);
  });
});

describe('favoriteGenresSchema', () => {
  it('allows an empty list (skip) but not duplicates', () => {
    expect(favoriteGenresSchema.parse([])).toEqual([]);
    expect(favoriteGenresSchema.safeParse(['romance', 'romance']).success).toBe(
      false,
    );
  });
});
