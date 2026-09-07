import type { User } from '@org/contracts';
import type { UserEntity } from '../database';

/** DB entity -> contract output shape (@org/contracts). */
export function toUser(e: UserEntity): User {
  return {
    id: e.id,
    name: e.name,
    username: e.username,
    email: e.email,
    birthDate: e.birthDate,
    favoriteGenres: e.favoriteGenres ?? [],
    status: e.status,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  };
}
