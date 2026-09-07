import { z } from 'zod';

/**
 * Genres offered on step 4. The slug is what travels/persists; the display
 * label is i18n (`genre.<slug>` in @org/i18n).
 */
export const GENRES = [
  'romance',
  'suspense',
  'ficcao-brasileira',
  'fantasia',
  'biografia',
  'classicos',
  'poesia',
  'nao-ficcao',
  'autoajuda',
  'terror',
  'policial',
  'quadrinhos',
] as const;

export const genreSchema = z.enum(GENRES);
export type Genre = z.infer<typeof genreSchema>;

/** i18n key for a genre's display label. */
export const genreLabelKey = (genre: Genre): string => `genre.${genre}`;

/** Favorite genres list. Empty is valid ("Skip for now"). No duplicates. */
export const favoriteGenresSchema = z
  .array(genreSchema)
  .max(GENRES.length)
  .refine(
    (list) => new Set(list).size === list.length,
    'validation.genres.duplicate',
  );

export type FavoriteGenres = z.infer<typeof favoriteGenresSchema>;
