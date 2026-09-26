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
import { TenantEntity } from './tenant.entity';

/** A manually registered expense. */
@Entity({ name: 'expense_entries' })
export class ExpenseEntryEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @ManyToOne(() => TenantEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant?: TenantEntity;

  @Column({ length: 200 })
  description!: string;

  @Column({ type: 'varchar', length: 60, nullable: true })
  category!: string | null;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  amount!: string;

  /** `YYYY-MM-DD`. */
  @Column({ type: 'date' })
  date!: string;

  @Column({ type: 'boolean', default: false })
  recurring!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
