import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MemberEntity } from './member.entity';
import { ServiceEntity } from './service.entity';

/** A service a professional performs, with their own price and duration. */
@Entity({ name: 'professional_services' })
@Index(['professionalId', 'serviceId'], { unique: true })
export class ProfessionalServiceEntity {
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

  @Column({ name: 'service_id', type: 'uuid' })
  serviceId!: string;

  @ManyToOne(() => ServiceEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'service_id' })
  service?: ServiceEntity;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  price!: string;

  @Column({ name: 'duration_minutes', type: 'int' })
  durationMinutes!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
