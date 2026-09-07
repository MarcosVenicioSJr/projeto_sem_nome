import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { VERIFICATION_PURPOSE, type VerificationPurpose } from '../enums';

/** `verification_codes` table (Security spec §3 and §8). Stores only the HASH. */
@Entity({ name: 'verification_codes' })
export class VerificationCodeEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'code_hash' })
  codeHash!: string;

  @Column({ type: 'enum', enum: VERIFICATION_PURPOSE })
  purpose!: VerificationPurpose;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ name: 'attempts_count', type: 'int', default: 0 })
  attemptsCount!: number;

  @Column({ name: 'consumed_at', type: 'timestamptz', nullable: true })
  consumedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
