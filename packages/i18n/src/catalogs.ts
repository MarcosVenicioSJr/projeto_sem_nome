import type { Catalog, Locale } from './types.js';
import { en } from './locales/en.js';
import { ptBR } from './locales/pt-BR.js';

export const catalogs: Record<Locale, Catalog> = {
  en,
  'pt-BR': ptBR,
};
