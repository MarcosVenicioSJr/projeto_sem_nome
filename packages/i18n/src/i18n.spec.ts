import { describe, expect, it } from 'vitest';
import { t } from './translate.js';
import { parseAcceptLanguage } from './accept-language.js';
import { translateZodError } from './zod.js';
import { en } from './locales/en.js';
import { ptBR } from './locales/pt-BR.js';

describe('t()', () => {
  it('resolves a key for a locale', () => {
    expect(t('errors.user.notFound', 'pt-BR')).toBe('Usuário não encontrado');
    expect(t('errors.user.notFound', 'en')).toBe('User not found');
  });

  it('interpolates params', () => {
    expect(t('validation.string.tooShort', 'en', { minimum: 8 })).toBe(
      'Must be at least 8 characters',
    );
  });

  it('falls back to the base locale, then the key', () => {
    expect(t('errors.user.notFound', 'en')).toBe(t('errors.user.notFound'));
    expect(t('nope.not.here', 'en')).toBe('nope.not.here');
  });
});

describe('parseAcceptLanguage()', () => {
  it.each([
    ['pt-BR,pt;q=0.9,en;q=0.8', 'pt-BR'],
    ['pt', 'pt-BR'],
    ['en-US,en;q=0.9', 'en'],
    ['fr-FR', 'en'],
    [undefined, 'en'],
  ])('%s -> %s', (header, expected) => {
    expect(parseAcceptLanguage(header)).toBe(expected);
  });
});

describe('translateZodError()', () => {
  it('maps a custom-key message and a derived code', () => {
    const error = {
      issues: [
        { code: 'custom', path: ['password'], message: 'validation.password.uppercase' },
        { code: 'too_small', origin: 'string', minimum: 2, path: ['name'] },
      ],
    };
    const out = translateZodError(error, 'en');
    expect(out[0]).toEqual({
      path: 'password',
      code: 'custom',
      message: 'Add an uppercase letter',
    });
    expect(out[1].message).toBe('Must be at least 2 characters');
  });
});

describe('catalog parity', () => {
  it('pt-BR covers every en key', () => {
    expect(Object.keys(ptBR).sort()).toEqual(Object.keys(en).sort());
  });
});
