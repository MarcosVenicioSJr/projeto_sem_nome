import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
  UpdateDateColumn,
} from 'typeorm';
import {
  APPOINTMENT_STATUS,
  APPOINTMENT_STATUS_ENUM_NAME,
  APPOINTMENT_STATUS_VALUES,
  type AppointmentStatus,
} from '../enums';
import { AppointmentServiceEntity } from './appointment-service.entity';
import { MemberEntity } from './member.entity';
import { TenantEntity } from './tenant.entity';

/**
 * A booking. The end customer has no account: only name and phone are kept.
 * `cancelToken` is the secret behind the cancellation link sent to them.
 */
@Entity({ name: 'appointments' })
@Index(['tenantId', 'professionalId', 'startAt'])
@Index(['tenantId', 'clientPhone', 'startAt'])
export class AppointmentEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @ManyToOne(() => TenantEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant?: TenantEntity;

  @Column({ name: 'professional_id', type: 'uuid' })
  professionalId!: string;

  @ManyToOne(() => MemberEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'professional_id' })
  professional?: MemberEntity;

  @Column({ name: 'client_name', length: 120 })
  clientName!: string;

  @Column({ name: 'client_phone', length: 11 })
  clientPhone!: string;

  @Column({ name: 'start_at', type: 'timestamptz' })
  startAt!: Date;

  @Column({ name: 'end_at', type: 'timestamptz' })
  endAt!: Date;

  @Column({
    type: 'enum',
    enum: APPOINTMENT_STATUS_VALUES,
    enumName: APPOINTMENT_STATUS_ENUM_NAME,
    default: APPOINTMENT_STATUS.CONFIRMED,
  })
  status!: AppointmentStatus;

  @Index({ unique: true })
  @Column({ name: 'cancel_token', length: 64 })
  cancelToken!: string;

  @Column({ name: 'cancelled_at', type: 'timestamptz', nullable: true })
  cancelledAt!: Date | null;

  @OneToMany(() => AppointmentServiceEntity, (s) => s.appointment)
  services?: Relation<AppointmentServiceEntity[]>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
