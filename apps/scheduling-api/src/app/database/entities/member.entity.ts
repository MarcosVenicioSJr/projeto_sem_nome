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
import {
  MEMBER_ROLE_ENUM_NAME,
  MEMBER_ROLE_VALUES,
  type MemberRole,
} from '../enums';
import { TenantEntity } from './tenant.entity';

/**
 * A tenant-bound account: the company's owner or one of their employees.
 * Belongs to exactly one tenant; email is globally unique.
 */
@Entity({ name: 'members' })
export class MemberEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @ManyToOne(() => TenantEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant?: TenantEntity;

  @Column({
    type: 'enum',
    enum: MEMBER_ROLE_VALUES,
    enumName: MEMBER_ROLE_ENUM_NAME,
  })
  role!: MemberRole;

  @Column({ length: 120 })
  name!: string;

  @Index({ unique: true })
  @Column()
  email!: string;

  @Column({ length: 11 })
  phone!: string;

  /** Commission (%) over the services done; only meaningful for employees. */
  @Column({
    name: 'commission_rate',
    type: 'numeric',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  commissionRate!: string | null;

  @Column({ name: 'password_hash' })
  passwordHash!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
