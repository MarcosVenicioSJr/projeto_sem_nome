import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ACCOUNT_STATUS, type AccountStatus } from '../enums';

/**
 * Entities are self-contained: they do NOT import `@org/contracts`, so the
 * Atlas TypeORM provider can load them standalone. Enum values live in
 * `database/enums/`; drift against `accountStatusSchema` in @org/contracts is
 * caught at compile time in `user.mapper.ts`.
 *
 * `users` table (Security spec §8).
 */
@Entity({ name: 'users' })
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 120 })
  name!: string;

  @Index({ unique: true })
  @Column({ length: 20 })
  username!: string;

  @Index({ unique: true })
  @Column()
  email!: string;

  @Column({ name: 'password_hash' })
  passwordHash!: string;

  @Column({ type: 'date', name: 'birth_date' })
  birthDate!: string;

  @Column({
    type: 'enum',
    enum: ACCOUNT_STATUS,
    default: 'pending_verification',
  })
  status!: AccountStatus;

  @Column({ name: 'email_verified_at', type: 'timestamptz', nullable: true })
  emailVerifiedAt!: Date | null;

  /** Genre slugs. The allowed values are enforced by the API contract, not the DB. */
  @Column({ name: 'favorite_genres', type: 'simple-array', default: '' })
  favoriteGenres!: string[];

  @Column({ name: 'failed_login_attempts', type: 'int', default: 0 })
  failedLoginAttempts!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
