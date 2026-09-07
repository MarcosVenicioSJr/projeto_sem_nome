import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { AccountStatus, Genre } from '@org/contracts';
import { accountStatusSchema } from '@org/contracts';

/** `users` table (Security spec §8). */
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
    enum: accountStatusSchema.options,
    default: 'pending_verification',
  })
  status!: AccountStatus;

  @Column({ name: 'email_verified_at', type: 'timestamptz', nullable: true })
  emailVerifiedAt!: Date | null;

  @Column({ name: 'favorite_genres', type: 'simple-array', default: '' })
  favoriteGenres!: Genre[];

  @Column({ name: 'failed_login_attempts', type: 'int', default: 0 })
  failedLoginAttempts!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
