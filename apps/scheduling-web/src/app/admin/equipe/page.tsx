'use client';

import { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardTitle } from '../_components/Card';
import { Avatar } from '../_components/Avatar';
import { Button } from '../_components/Button';
import { Tabs } from '../_components/Tabs';
import { Table, type Column } from '../_components/Table';
import { useAdminData } from '../_lib/data';
import { useNow } from '../_lib/use-now';
import { decorateAll, barberLiveState, barberOccupancyPct } from '../_lib/selectors';
import { brl, brl0, ddmm, hm, nowMinutes, WEEKDAYS_SHORT } from '../_lib/format';
import type { Barber } from '../_lib/types';
import styles from './page.module.css';

type TeamTab = 'barbeiros' | 'horarios' | 'comissoes';

export default function EquipePage() {
  return (
    <Suspense fallback={null}>
      <EquipeView />
    </Suspense>
  );
}

function EquipeView() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as TeamTab) ?? 'barbeiros';
  const [tab, setTab] = useState<TeamTab>(['barbeiros', 'horarios', 'comissoes'].includes(initialTab) ? initialTab : 'barbeiros');

  const { barbers, services, appointments, commissionPct, commissionPaid, setCommissionPct, payCommission, showToast } = useAdminData();
  const router = useRouter();
  const now = useNow();
  const nowMin = nowMinutes(now);

  const decorated = useMemo(() => decorateAll(appointments, services, barbers), [appointments, services, barbers]);
  const today = decorated.filter((a) => a.date === 0);

  return (
    <div className={styles.page}>
      <Tabs
        items={[
          { key: 'barbeiros', label: 'Barbeiros' },
          { key: 'horarios', label: 'Horários' },
          { key: 'comissoes', label: 'Comissões' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'barbeiros' ? (
        <div className={styles.cards}>
          {barbers.map((barber) => {
            const live = barberLiveState(barber, today, nowMin);
            const todayCount = today.filter((a) => a.barberId === barber.id).length;
            const occ = barberOccupancyPct(barber, today);
            return (
              <Card key={barber.id}>
                <div className={styles.cardHead}>
                  <Avatar initials={barber.initials} size={46} />
                  <div className={styles.cardInfo}>
                    <span className={styles.cardName}>{barber.name}</span>
                    <span className={styles.cardRole}>
                      {barber.role} · Na casa desde {barber.since}
                    </span>
                  </div>
                </div>
                <div className={styles.cardState}>
                  <span className={styles.dot} style={{ background: live.busy ? 'var(--accent)' : 'var(--faint)' }} />
                  {live.state}
                </div>
                <div className={styles.metrics}>
                  <div className={styles.metric}>
                    <span className={styles.metricLabel}>Hoje</span>
                    <span className={styles.metricValue}>{todayCount}</span>
                  </div>
                  <div className={styles.metric}>
                    <span className={styles.metricLabel}>Ocupação</span>
                    <span className={styles.metricValue}>{occ}%</span>
                  </div>
                  <div className={styles.metric}>
                    <span className={styles.metricLabel}>Comissão</span>
                    <span className={styles.metricValue}>{commissionPct[barber.id]}%</span>
                  </div>
                </div>
                <Button style={{ width: '100%' }} onClick={() => router.push(`/admin/agenda?barber=${barber.id}`)}>
                  Ver agenda de hoje
                </Button>
              </Card>
            );
          })}
        </div>
      ) : null}

      {tab === 'horarios' ? (
        <div className={styles.scheduleWrap}>
          <table className={styles.scheduleTable}>
            <thead>
              <tr>
                <th>Barbeiro</th>
                {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                  <th key={d}>{WEEKDAYS_SHORT[d]}</th>
                ))}
                <th>Intervalo</th>
              </tr>
            </thead>
            <tbody>
              {barbers.map((barber) => (
                <tr key={barber.id}>
                  <td>{barber.name}</td>
                  {[1, 2, 3, 4, 5, 6, 0].map((d) => {
                    const off = (barber.off as number[]).includes(d) || d === 0;
                    return (
                      <td key={d} className={off ? styles.off : undefined}>
                        {off ? 'Folga' : `${hm(barber.start)}–${hm(barber.end)}`}
                      </td>
                    );
                  })}
                  <td>
                    {hm(barber.brk[0])}–{hm(barber.brk[1])}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === 'comissoes' ? (
        <CommissionsTab
          barbers={barbers}
          commissionPct={commissionPct}
          commissionPaid={commissionPaid}
          setCommissionPct={setCommissionPct}
          payCommission={payCommission}
          showToast={showToast}
        />
      ) : null}
    </div>
  );
}

function CommissionsTab({
  barbers,
  commissionPct,
  commissionPaid,
  setCommissionPct,
  payCommission,
  showToast,
}: {
  barbers: Barber[];
  commissionPct: Record<string, number>;
  commissionPaid: Record<string, boolean>;
  setCommissionPct: (id: string, pct: number) => void;
  payCommission: (id: string) => void;
  showToast: (msg: string) => void;
}) {
  const now = new Date();
  const monthLabel = now.toLocaleDateString('pt-BR', { month: 'long' });
  const period = `${monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)} ${now.getFullYear()} · 1 a ${now.getDate()}`;

  const rows = barbers.map((b) => {
    const pct = commissionPct[b.id];
    const commission = (b.revenue * pct) / 100;
    return { ...b, pct, commission, paid: !!commissionPaid[b.id] };
  });
  const total = rows.filter((r) => !r.paid).reduce((sum, r) => sum + r.commission, 0);

  const cols: Column<(typeof rows)[number]>[] = [
    { key: 'name', header: 'Barbeiro', render: (r) => r.name },
    {
      key: 'pct',
      header: '% fixa',
      align: 'center',
      render: (r) => (
        <div className={styles.stepper}>
          <button type="button" className={styles.stepBtn} onClick={() => setCommissionPct(r.id, r.pct - 5)} aria-label={`Diminuir % de ${r.name}`}>
            −
          </button>
          <span className="tabularNums">{r.pct}%</span>
          <button type="button" className={styles.stepBtn} onClick={() => setCommissionPct(r.id, r.pct + 5)} aria-label={`Aumentar % de ${r.name}`}>
            +
          </button>
        </div>
      ),
    },
    { key: 'fat', header: 'Faturado', render: (r) => brl(r.revenue) },
    { key: 'com', header: 'Comissão', render: (r) => brl(r.commission) },
    {
      key: 'pay',
      header: '',
      align: 'right',
      render: (r) =>
        r.paid ? (
          <span style={{ color: 'var(--ok)', fontSize: 12, fontWeight: 600 }}>✓ Pago em {ddmm(0)}</span>
        ) : (
          <Button
            onClick={() => {
              payCommission(r.id);
              showToast(`Pagamento de ${brl(r.commission)} registrado para ${r.short}`);
            }}
          >
            Registrar pagamento
          </Button>
        ),
    },
  ];

  return (
    <Card>
      <div className={styles.comHeader}>
        <span className={styles.comPeriod}>{period}</span>
        <div style={{ textAlign: 'right' }}>
          <div className={styles.comTotalLabel}>Total a pagar</div>
          <div className={styles.comTotalValue}>{brl0(total)}</div>
        </div>
      </div>
      <Table columns={cols} rows={rows} />
      <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 12 }}>
        A % fixa vale para todos os serviços do barbeiro. Venda de produtos não entra na comissão.
      </p>
    </Card>
  );
}
