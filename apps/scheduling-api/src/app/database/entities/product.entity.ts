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

/** An item for sale, with its own quantity (separate from consumables). */
@Entity({ name: 'products' })
export class ProductEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @ManyToOne(() => TenantEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant?: TenantEntity;

  @Column({ length: 120 })
  name!: string;

  @Column({ type: 'varchar', length: 60, nullable: true })
  category!: string | null;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  price!: string;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  cost!: string;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  quantity!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
