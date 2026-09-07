import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * `terms_acceptances` table — LGPD compliance proof (LGPD doc §3):
 * acceptance timestamp + current version + granular consents.
 */
@Entity({ name: 'terms_acceptances' })
export class TermsAcceptanceEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'terms_version' })
  termsVersion!: string;

  @Column({ name: 'consent_recommendations', type: 'boolean', default: false })
  consentRecommendations!: boolean;

  @Column({ name: 'consent_marketing', type: 'boolean', default: false })
  consentMarketing!: boolean;

  @CreateDateColumn({ name: 'accepted_at', type: 'timestamptz' })
  acceptedAt!: Date;
}
