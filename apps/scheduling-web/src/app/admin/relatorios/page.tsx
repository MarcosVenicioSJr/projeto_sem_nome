'use client';

import { useState } from 'react';
import { Card, CardTitle } from '../_components/Card';
import { Button } from '../_components/Button';
import { useAdminData } from '../_lib/data';
import { brl0 } from '../_lib/format';
import { TOP_SERVICES_REPORT } from '../_lib/mock-data';
import styles from './page.module.css';

type ReportKey = 'servicos' | 'barbeiros';

export default function RelatoriosPage() {
  const { barbers, showToast } = useAdminData();
  const [active, setActive] = useState<ReportKey>('servicos');

  const reports: Record<ReportKey, { title: string; sub: string; rows: Array<[string, number]>; format: (v: number) => string }> = {
    servicos: {
      title: 'Serviços mais vendidos',
      sub: 'Quantidade no mês (1 a ' + new Date().getDate() + ')',
      rows: TOP_SERVICES_REPORT,
      format: (v) => String(v),
    },
    barbeiros: {
      title: 'Faturamento por barbeiro',
      sub: 'Serviços no mês (1 a ' + new Date().getDate() + ')',
      rows: barbers.map((b) => [b.name, b.revenue] as [string, number]),
      format: brl0,
    },
  };

  const list: Array<{ key: ReportKey; title: string; sub: string }> = [
    { key: 'servicos', title: reports.servicos.title, sub: reports.servicos.sub },
    { key: 'barbeiros', title: reports.barbeiros.title, sub: reports.barbeiros.sub },
  ];

  const current = reports[active];
  const max = Math.max(...current.rows.map(([, v]) => v));

  return (
    <div className={styles.page}>
      <div className={styles.list}>
        {list.map((item) => (
          <button
            key={item.key}
            type="button"
            className={[styles.listItem, active === item.key ? styles.listItemActive : ''].join(' ')}
            onClick={() => setActive(item.key)}
          >
            <span className={styles.listTitle}>{item.title}</span>
            <span className={styles.listSub}>{item.sub}</span>
          </button>
        ))}
      </div>

      <Card>
        <div className={styles.previewHead}>
          <div>
            <CardTitle>{current.title}</CardTitle>
            <span className={styles.listSub}>{current.sub}</span>
          </div>
          <Button onClick={() => showToast(`Relatório "${current.title}" exportado em CSV`)}>Exportar CSV</Button>
        </div>
        <div className={styles.bars}>
          {current.rows.map(([label, value], i) => (
            <div key={label} className={styles.barRow}>
              <div className={styles.barTop}>
                <span>{label}</span>
                <span className="tabularNums">{current.format(value)}</span>
              </div>
              <div className={styles.barTrack}>
                <div
                  className={styles.barFill}
                  style={{ width: `${(value / max) * 100}%`, background: i === 0 ? 'var(--accent-bg)' : 'var(--surface-3)' }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
