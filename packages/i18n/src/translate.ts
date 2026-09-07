import { catalogs } from './catalogs.js';
import { DEFAULT_LOCALE, type Locale } from './types.js';

export type TranslateParams = Record<string, string | number>;

const interpolate = (template: string, params: TranslateParams): string =>
  template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );

/**
 * Resolves a dotted key against the given locale, falling back to the base
 * locale and finally to the key itself. `{param}` placeholders are filled
 * from `params`.
 */
export function t(
  key: string,
  locale: Locale = DEFAULT_LOCALE,
  params?: TranslateParams,
): string {
  const message =
    catalogs[locale]?.[key] ?? catalogs[DEFAULT_LOCALE][key] ?? key;
  return params ? interpolate(message, params) : message;
}
