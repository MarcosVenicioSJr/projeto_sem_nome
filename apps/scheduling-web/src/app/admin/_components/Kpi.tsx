import { Card } from './Card';
import styles from './Kpi.module.css';

export function Kpi({
  label,
  value,
  sub,
  progressPct,
}: {
  label: string;
  value: string;
  sub?: string;
  /** quando definido, mostra a barra de progresso (0-100) */
  progressPct?: number;
}) {
  return (
    <Card className={styles.kpi}>
      <span className={styles.label}>{label}</span>
      <span className={`${styles.value} tabularNums`}>{value}</span>
      {progressPct != null ? (
        <div className={`${styles.bar} stripes`}>
          <div className={styles.barFill} style={{ width: Math.max(0, Math.min(100, progressPct)) + '%' }} />
        </div>
      ) : null}
      {sub ? <span className={styles.sub}>{sub}</span> : null}
    </Card>
  );
}
