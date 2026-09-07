import type { Genre, User } from '@org/contracts';
import type { UserEntity } from '../database';

/**
 * DB entity -> contract output shape (@org/contracts).
 * `status` is checked structurally against `User['status']` at compile time —
 * if the entity's ACCOUNT_STATUS and the contract's accountStatusSchema drift,
 * this file stops compiling.
 */
export function toUser(e: UserEntity): User {
  return {
    id: e.id,
    name: e.name,
    username: e.username,
    email: e.email,
    birthDate: e.birthDate,
    // written through favoriteGenresSchema, so the values are known-good slugs
    favoriteGenres: (e.favoriteGenres ?? []) as Genre[],
    status: e.status,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  };
}
