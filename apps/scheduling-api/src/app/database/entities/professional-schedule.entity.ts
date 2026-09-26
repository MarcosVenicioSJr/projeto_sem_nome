import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { MemberEntity } from './member.entity';

/** Weekly hours of a professional. No row for a weekday = day off. */
@Entity({ name: 'professional_schedules' })
@Index(['professionalId', 'weekday'], { unique: true })
export class ProfessionalScheduleEntity {
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

  /** 0 = Sunday ... 6 = Saturday. */
  @Column({ type: 'smallint' })
  weekday!: number;

  /** Minutes since 00:00, in the tenant's local time. */
  @Column({ name: 'start_minute', type: 'int' })
  startMinute!: number;

  @Column({ name: 'end_minute', type: 'int' })
  endMinute!: number;

  @Column({ name: 'break_start_minute', type: 'int', nullable: true })
  breakStartMinute!: number | null;

  @Column({ name: 'break_end_minute', type: 'int', nullable: true })
  breakEndMinute!: number | null;
}
