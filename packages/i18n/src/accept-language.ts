import { DEFAULT_LOCALE, isLocale, LOCALES, type Locale } from './types.js';

/**
 * Picks the best supported locale from an `Accept-Language` header value.
 * Matches exact tags first (`pt-BR`), then the primary subtag (`pt` → `pt-BR`).
 * Falls back to the default locale.
 */
export function parseAcceptLanguage(header?: string | null): Locale {
  if (!header) return DEFAULT_LOCALE;

  const requested = header
    .split(',')
    .map((part) => {
      const [tag, q] = part.trim().split(';q=');
      return { tag: tag.trim(), q: q ? Number(q) : 1 };
    })
    .filter((entry) => entry.tag)
    .sort((a, b) => b.q - a.q);

  for (const { tag } of requested) {
    if (isLocale(tag)) return tag;
    const primary = tag.split('-')[0].toLowerCase();
    const match = LOCALES.find((locale) => locale.split('-')[0] === primary);
    if (match) return match;
  }
  return DEFAULT_LOCALE;
}
