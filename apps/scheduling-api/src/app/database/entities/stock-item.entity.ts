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

/** Internal consumable (not for sale). Quantity is adjusted manually. */
@Entity({ name: 'stock_items' })
export class StockItemEntity {
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

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  quantity!: string;

  @Column({ length: 20 })
  unit!: string;

  @Column({
    name: 'min_quantity',
    type: 'numeric',
    precision: 10,
    scale: 2,
    default: 0,
  })
  minQuantity!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
