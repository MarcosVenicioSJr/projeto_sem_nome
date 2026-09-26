import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { MemberEntity } from './member.entity';

/** A block on a specific date: the whole day (minutes null) or a window. */
@Entity({ name: 'professional_time_off' })
@Index(['professionalId', 'date'])
export class ProfessionalTimeOffEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'professional_id', type: 'uuid' })
  professionalId!: string;

  @ManyToOne(() => MemberEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'professional_id' })
  professional?: MemberEntity;

  /** `YYYY-MM-DD`, tenant's local calendar day. */
  @Column({ type: 'date' })
  date!: string;

  @Column({ name: 'start_minute', type: 'int', nullable: true })
  startMinute!: number | null;

  @Column({ name: 'end_minute', type: 'int', nullable: true })
  endMinute!: number | null;
}
