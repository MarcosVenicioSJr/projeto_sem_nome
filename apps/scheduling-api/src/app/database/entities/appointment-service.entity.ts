import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { AppointmentEntity } from './appointment.entity';
import { ServiceEntity } from './service.entity';

/** A service inside a booking, with the price/duration frozen at booking time. */
@Entity({ name: 'appointment_services' })
export class AppointmentServiceEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'appointment_id', type: 'uuid' })
  appointmentId!: string;

  @ManyToOne(() => AppointmentEntity, (a) => a.services, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'appointment_id' })
  appointment?: Relation<AppointmentEntity>;

  @Column({ name: 'service_id', type: 'uuid' })
  serviceId!: string;

  @ManyToOne(() => ServiceEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'service_id' })
  service?: ServiceEntity;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  price!: string;

  @Column({ name: 'duration_minutes', type: 'int' })
  durationMinutes!: number;
}
