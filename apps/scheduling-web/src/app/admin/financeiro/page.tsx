'use client';

import { useMemo, useState } from 'react';
import { Card, CardTitle } from '../_components/Card';
import { Kpi } from '../_components/Kpi';
import { Button } from '../_components/Button';
import { Dialog } from '../_components/Dialog';
import { useAdminData } from '../_lib/data';
import { decorateAll } from '../_lib/selectors';
import { brl, brl0 } from '../_lib/format';
import { MONTH_EXPENSES, MONTH_REVENUE, PAYMENT_METHODS } from '../_lib/mock-data';
import styles from './page.module.css';

const CASH_FLOAT = 200;

export default function FinanceiroPage() {
  const { barbers, services, appointments, commissionPct, cashClosedAt, closeCash, reopenCash, showToast } = useAdminData();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const decorated = useMemo(() => decorateAll(appointments, services, barbers), [appointments, services, barbers]);
  const doneToday = decorated.filter((a) => a.date === 0 && a.status === 'done').sort((a, b) => a.end - b.end);

  const entries = useMemo(() => {
    const fromAppts = doneToday.map((a, i) => ({
      time: a.timeLabel,
      description: `${a.service.name} · ${a.clientName}`,
      method: PAYMENT_METHODS[i % PAYMENT_METHODS.length],
      value: a.service.price,
      by: a.barber.short,
    }));
    const extra = [
      { time: '09:40', description: 'Venda · Pomada matte 120g', method: 'Pix' as const, value: 45, by: 'Balcão' },
      { time: '11:15', description: 'Venda · Óleo para barba 30ml', method: 'Crédito' as const, value: 39, by: 'Balcão' },
      { time: '10:12', description: 'Compra · Lâminas descartáveis', method: 'Dinheiro' as const, value: -86, by: 'Balcão' },
    ];
    return [...fromAppts, ...extra].sort((a, b) => b.time.localeCompare(a.time));
  }, [doneToday]);

  const entradas = entries.filter((e) => e.value > 0).reduce((sum, e) => sum + e.value, 0);
  const saidas = entries.filter((e) => e.value < 0).reduce((sum, e) => sum + Math.abs(e.value), 0);
  const saldo = CASH_FLOAT + entradas - saidas;

  const byMethod = PAYMENT_METHODS.map((m) => {
    const value = entries.filter((e) => e.value > 0 && e.method === m).reduce((sum, e) => sum + e.value, 0);
    return { method: m, value, pct: entradas > 0 ? (value / entradas) * 100 : 0 };
  });

  const comMonth = barbers.reduce((sum, b) => sum + (b.revenue * commissionPct[b.id]) / 100, 0);
  const resultado = MONTH_REVENUE - comMonth - MONTH_EXPENSES;

  const kpis = [
    { label: 'Receita · mês', value: brl0(MONTH_REVENUE), sub: 'serviços + produtos' },
    { label: 'Comissões', value: brl0(comMonth), sub: '% fixa por barbeiro' },
    { label: 'Despesas', value: brl0(MONTH_EXPENSES), sub: 'aluguel, insumos, energia' },
    { label: 'Resultado estimado', value: brl0(resultado), sub: 'antes de impostos' },
  ];

  function handleConfirmClose() {
    closeCash();
    setConfirmOpen(false);
    showToast(`Caixa fechado. Saldo ${brl(saldo)}`);
  }

  return (
    <div className={styles.page}>
      <div className={styles.kpis}>
        {kpis.map((k) => (
          <Kpi key={k.label} {...k} />
        ))}
      </div>

      <div className={styles.layout}>
        <Card>
          <div className={styles.caixaHeadRow}>
            <div>
              <CardTitle>Caixa de hoje</CardTitle>
              <span className={styles.caixaSub}>aberto às 08:00 · troco {brl(CASH_FLOAT)}</span>
            </div>
          </div>

          {cashClosedAt ? (
            <div className={styles.closedBanner}>
              <span>Caixa fechado às {cashClosedAt}</span>
              <button type="button" onClick={() => { reopenCash(); showToast('Caixa reaberto'); }}>
                Reabrir
              </button>
            </div>
          ) : null}

          <div className={styles.methods}>
            {byMethod.map((m) => (
              <div key={m.method} className={styles.methodRow}>
                <div className={styles.methodTop}>
                  <span>{m.method}</span>
                  <span className="tabularNums">{brl(m.value)}</span>
                </div>
                <div className={styles.methodBar}>
                  <div className={styles.methodFill} style={{ width: m.pct + '%' }} />
                </div>
              </div>
            ))}
          </div>

          <div className={styles.totalsRow}>
            <span>Entradas</span>
            <span className="tabularNums">{brl(entradas)}</span>
          </div>
          <div className={styles.totalsRow}>
            <span>Saídas</span>
            <span className="tabularNums" style={{ color: 'var(--danger)' }}>
              {brl(saidas)}
            </span>
          </div>
          <div className={styles.saldoRow}>
            <span>Saldo em caixa</span>
            <span className={styles.saldoValue}>{brl(saldo)}</span>
          </div>

          {!cashClosedAt ? (
            <Button variant="primary" style={{ width: '100%' }} onClick={() => setConfirmOpen(true)}>
              Fechar caixa
            </Button>
          ) : null}
        </Card>

        <Card>
          <CardTitle>Lançamentos de hoje</CardTitle>
          {entries.map((e, i) => (
            <div key={i} className={styles.entryRow}>
              <span className={styles.entryTime}>{e.time}</span>
              <div>
                <div className={styles.entryDesc}>{e.description}</div>
                <div className={styles.entryBy}>
                  {e.method} · {e.by}
                </div>
              </div>
              <span className="tabularNums" style={{ color: e.value > 0 ? 'var(--text)' : 'var(--danger)', fontWeight: 600 }}>
                {e.value > 0 ? '+ ' : '− '}
                {brl(Math.abs(e.value))}
              </span>
            </div>
          ))}
        </Card>
      </div>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Fechar o caixa de hoje?" subtitle="Depois de fechado, os lançamentos do dia ficam bloqueados até reabrir.">
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Button onClick={() => setConfirmOpen(false)}>Cancelar</Button>
          <Button variant="primary" onClick={handleConfirmClose}>
            Fechar caixa
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
