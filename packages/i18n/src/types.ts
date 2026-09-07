export const LOCALES = ['en', 'pt-BR'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

/** Flat map of dotted key -> message (with optional `{param}` placeholders). */
export type Catalog = Record<string, string>;

export const isLocale = (value: string): value is Locale =>
  (LOCALES as readonly string[]).includes(value);
