'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardTitle } from '../_components/Card';
import { Button } from '../_components/Button';
import { useSession } from '../../_lib/session';
import { useAdminData } from '../_lib/data';
import { brl0 } from '../_lib/format';
import styles from './page.module.css';

type ReportKey = 'faturamento' | 'clientes';
type Row = [label: string, value: number];

const MONTHS_BACK = 6;
const MONTH_ABBR = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/** Últimos meses, do mais antigo ao atual, como `YYYY-MM`. */
function lastMonths(count: number): string[] {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (count - 1 - i), 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
}

const monthLabel = (m: string) => `${MONTH_ABBR[Number(m.slice(5)) - 1]}/${m.slice(2, 4)}`;

/** Relatórios mensais (granularidade fixa, sem filtro de período). */
export default function RelatoriosPage() {
  const { api, isManagement } = useSession();
  const { showToast } = useAdminData();
  const [active, setActive] = useState<ReportKey>('faturamento');
  const months = useMemo(() => lastMonths(MONTHS_BACK), []);
  const [revenue, setRevenue] = useState<Row[]>([]);
  const [clients, setClients] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isManagement) return;
    Promise.all(
      months.map(async (m) => {
        const [rev, cli] = await Promise.all([
          api<{ total: number }>(`/finance/reports/revenue?month=${m}`),
          api<{ clients: number }>(`/finance/reports/clients?month=${m}`),
        ]);
        return { m, revenue: rev.total, clients: cli.clients };
      }),
    )
      .then((rows) => {
        setRevenue(rows.map((r) => [monthLabel(r.m), r.revenue]));
        setClients(rows.map((r) => [monthLabel(r.m), r.clients]));
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Não foi possível carregar os relatórios.'));
  }, [api, isManagement, months]);

  if (!isManagement) {
    return (
      <div className={styles.page}>
        <p style={{ color: 'var(--muted)' }}>Somente o dono ou gerente acessa os relatórios.</p>
      </div>
    );
  }

  const reports: Record<ReportKey, { title: string; sub: string; rows: Row[]; format: (v: number) => string }> = {
    faturamento: {
      title: 'Faturamento por mês',
      sub: 'Soma das receitas de atendimentos concluídos',
      rows: revenue,
      format: brl0,
    },
    clientes: {
      title: 'Clientes por mês',
      sub: 'Telefones distintos com atendimento concluído',
      rows: clients,
      format: String,
    },
  };
  const list = (Object.keys(reports) as ReportKey[]).map((key) => ({ key, title: reports[key].title, sub: reports[key].sub }));
  const current = reports[active];
  const max = Math.max(1, ...current.rows.map(([, v]) => v));

  function exportCsv() {
    const csv = ['mês;valor', ...current.rows.map(([label, value]) => `${label};${String(value).replace('.', ',')}`)].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${active}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Relatório "${current.title}" exportado em CSV`);
  }

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
          <Button onClick={exportCsv}>Exportar CSV</Button>
        </div>
        {error ? <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</p> : null}
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
                  style={{ width: `${(value / max) * 100}%`, background: i === current.rows.length - 1 ? 'var(--accent-bg)' : 'var(--surface-3)' }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
