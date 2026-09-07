import { z } from 'zod';
import { favoriteGenresSchema } from '../common/index.js';

/**
 * STEP 4 - "What do you like to read?".
 * Skippable ("Skip for now") -> an empty list is valid.
 * Body of PUT /users/me/preferences (authenticated route, post-signup).
 */
export const updatePreferencesSchema = z.object({
  favoriteGenres: favoriteGenresSchema,
});
export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
