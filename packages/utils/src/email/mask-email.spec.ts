import { describe, expect, it } from 'vitest';
import { maskEmail } from './mask-email.js';

describe('maskEmail (Security spec §5)', () => {
  it('keeps the first letter and the domain', () => {
    expect(maskEmail('helena@gmail.com')).toBe('h***@gmail.com');
    expect(maskEmail('a@b.com')).toBe('a***@b.com');
  });

  it('returns the input unchanged when there is no local part', () => {
    expect(maskEmail('@nope')).toBe('@nope');
    expect(maskEmail('plain')).toBe('plain');
  });
});
