import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import {
  PAYMENT_METHOD_ENUM_NAME,
  PAYMENT_METHOD_VALUES,
  type PaymentMethod,
} from '../enums';
import { AppointmentEntity } from './appointment.entity';
import { MemberEntity } from './member.entity';

/** What was received for a completed appointment. Informational only. */
@Entity({ name: 'revenue_entries' })
export class RevenueEntryEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Index({ unique: true })
  @Column({ name: 'appointment_id', type: 'uuid' })
  appointmentId!: string;

  @OneToOne(() => AppointmentEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'appointment_id' })
  appointment?: AppointmentEntity;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  amount!: string;

  @Column({
    name: 'payment_method',
    type: 'enum',
    enum: PAYMENT_METHOD_VALUES,
    enumName: PAYMENT_METHOD_ENUM_NAME,
  })
  paymentMethod!: PaymentMethod;

  @Column({ name: 'recorded_by_id', type: 'uuid', nullable: true })
  recordedById!: string | null;

  @ManyToOne(() => MemberEntity, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'recorded_by_id' })
  recordedBy?: MemberEntity;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
