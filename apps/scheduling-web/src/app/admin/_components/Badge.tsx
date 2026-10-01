import type { AppointmentStatus } from '../_lib/types';
import styles from './Badge.module.css';

const STATUS_META: Record<
  AppointmentStatus,
  { label: string; className: string }
> = {
  done: { label: 'Concluído', className: styles.done },
  confirmed: { label: 'Confirmado', className: styles.confirmed },
  pending: { label: 'Aguardando confirmação', className: styles.pending },
};

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  const meta = STATUS_META[status];
  return (
    <span className={`${styles.badge} ${meta.className}`}>{meta.label}</span>
  );
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'ok' | 'danger' | 'accent';
}) {
  return <span className={`${styles.badge} ${styles[tone]}`}>{children}</span>;
}
