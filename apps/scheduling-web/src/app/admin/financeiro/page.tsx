'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  CommissionLine,
  Expense,
  PaymentMethod,
  RevenueLine,
} from '@org/contracts';
import { Card, CardTitle } from '../_components/Card';
import { Kpi } from '../_components/Kpi';
import { Button } from '../_components/Button';
import { Dialog } from '../_components/Dialog';
import { Field, Input } from '../_components/Field';
import { useSession } from '../../_lib/session';
import { useAdminData } from '../_lib/data';
import { brl, brl0, hm } from '../_lib/format';
import styles from './page.module.css';

const METHODS: Array<{ key: PaymentMethod; label: string }> = [
  { key: 'pix', label: 'Pix' },
  { key: 'credit', label: 'Crédito' },
  { key: 'debit', label: 'Débito' },
  { key: 'cash', label: 'Dinheiro' },
];

const localDay = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const EMPTY_EXPENSE = {
  description: '',
  category: '',
  amount: '',
  date: localDay(),
  recurring: false,
};

/**
 * Registro manual do que já aconteceu (sem gateway): receitas vêm dos
 * atendimentos concluídos, despesas são digitadas e a comissão é o
 * fechamento do dia (só mostra o valor a receber).
 */
export default function FinanceiroPage() {
  const { api, isManagement } = useSession();
  const { showToast } = useAdminData();

  const today = useMemo(() => localDay(), []);
  const month = today.slice(0, 7);

  const [revenues, setRevenues] = useState<RevenueLine[]>([]);
  const [commissions, setCommissions] = useState<CommissionLine[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [monthRevenue, setMonthRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_EXPENSE);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [rev, com, exp, report] = await Promise.all([
        api<RevenueLine[]>(`/finance/revenues?date=${today}`),
        api<CommissionLine[]>(`/finance/commissions?date=${today}`),
        api<Expense[]>('/finance/expenses'),
        api<{ total: number }>(`/finance/reports/revenue?month=${month}`),
      ]);
      setRevenues(rev);
      setCommissions(com);
      setExpenses(exp);
      setMonthRevenue(report.total);
      setError(null);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Não foi possível carregar o financeiro.',
      );
    } finally {
      setLoading(false);
    }
  }, [api, today, month]);

  useEffect(() => {
    if (isManagement) void load();
  }, [isManagement, load]);

  if (!isManagement) {
    return (
      <div className={styles.page}>
        <p style={{ color: 'var(--muted)' }}>
          Somente o dono ou gerente acessa o financeiro.
        </p>
      </div>
    );
  }

  const monthExpenses = expenses
    .filter((e) => e.date.startsWith(month))
    .reduce((sum, e) => sum + e.amount, 0);
  const receivedToday = revenues.reduce((sum, r) => sum + r.amount, 0);
  const commissionToday = commissions.reduce((sum, c) => sum + c.commission, 0);

  const kpis = [
    {
      label: 'Receita · mês',
      value: brl0(monthRevenue),
      sub: 'atendimentos concluídos',
    },
    {
      label: 'Despesas · mês',
      value: brl0(monthExpenses),
      sub: 'lançadas manualmente',
    },
    {
      label: 'Resultado do mês',
      value: brl0(monthRevenue - monthExpenses),
      sub: 'receita − despesas',
    },
    {
      label: 'Comissões · hoje',
      value: brl0(commissionToday),
      sub: 'fechamento do dia',
    },
  ];

  const byMethod = METHODS.map((m) => {
    const value = revenues
      .filter((r) => r.paymentMethod === m.key)
      .reduce((sum, r) => sum + r.amount, 0);
    return {
      ...m,
      value,
      pct: receivedToday > 0 ? (value / receivedToday) * 100 : 0,
    };
  });

  const validExpense =
    form.description.trim().length >= 2 &&
    form.amount !== '' &&
    Number(form.amount) >= 0 &&
    form.date !== '';

  async function handleCreateExpense() {
    setBusy(true);
    try {
      const created = await api<Expense>('/finance/expenses', {
        method: 'POST',
        body: {
          description: form.description.trim(),
          category: form.category.trim() || null,
          amount: Number(form.amount),
          date: form.date,
          recurring: form.recurring,
        },
      });
      setExpenses((prev) =>
        [created, ...prev].sort((a, b) => b.date.localeCompare(a.date)),
      );
      showToast('Despesa registrada');
      setDialogOpen(false);
      setForm({ ...EMPTY_EXPENSE, date: localDay() });
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Não foi possível registrar');
    } finally {
      setBusy(false);
    }
  }

  async function handleRemoveExpense(expense: Expense) {
    if (!window.confirm(`Excluir a despesa "${expense.description}"?`)) return;
    try {
      await api<void>(`/finance/expenses/${expense.id}`, { method: 'DELETE' });
      setExpenses((prev) => prev.filter((e) => e.id !== expense.id));
      showToast('Despesa excluída');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Não foi possível excluir');
    }
  }

  const timeOf = (iso: string) => {
    const d = new Date(iso);
    return hm(d.getHours() * 60 + d.getMinutes());
  };

  return (
    <div className={styles.page}>
      {error ? (
        <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</p>
      ) : null}
      {loading ? (
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>Carregando…</p>
      ) : null}

      <div className={styles.kpis}>
        {kpis.map((k) => (
          <Kpi key={k.label} {...k} />
        ))}
      </div>

      <div className={styles.layout}>
        <Card>
          <div className={styles.caixaHeadRow}>
            <div>
              <CardTitle>Recebido hoje</CardTitle>
              <span className={styles.caixaSub}>
                o que o balcão informou ao concluir cada atendimento
              </span>
            </div>
          </div>

          <div className={styles.methods}>
            {byMethod.map((m) => (
              <div key={m.key} className={styles.methodRow}>
                <div className={styles.methodTop}>
                  <span>{m.label}</span>
                  <span className="tabularNums">{brl(m.value)}</span>
                </div>
                <div className={styles.methodBar}>
                  <div
                    className={styles.methodFill}
                    style={{ width: m.pct + '%' }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className={styles.saldoRow}>
            <span>Total recebido</span>
            <span className={styles.saldoValue}>{brl(receivedToday)}</span>
          </div>
        </Card>

        <Card>
          <CardTitle>Lançamentos de hoje</CardTitle>
          {revenues.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: 13 }}>
              Nenhum atendimento concluído hoje.
            </p>
          ) : null}
          {[...revenues].reverse().map((r) => (
            <div key={r.id} className={styles.entryRow}>
              <span className={styles.entryTime}>{timeOf(r.time)}</span>
              <div>
                <div className={styles.entryDesc}>
                  {r.services} · {r.clientName}
                </div>
                <div className={styles.entryBy}>
                  {METHODS.find((m) => m.key === r.paymentMethod)?.label} ·{' '}
                  {r.professionalName}
                </div>
              </div>
              <span className="tabularNums" style={{ fontWeight: 600 }}>
                + {brl(r.amount)}
              </span>
            </div>
          ))}
        </Card>
      </div>

      <div className={styles.layout}>
        <Card>
          <CardTitle>Comissões · fechamento de hoje</CardTitle>
          {commissions.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: 13 }}>
              Sem serviços hoje.
            </p>
          ) : null}
          {commissions.map((c) => (
            <div key={c.professionalId} className={styles.entryRow}>
              <span className={styles.entryTime}>{c.servicesDone}×</span>
              <div>
                <div className={styles.entryDesc}>{c.professionalName}</div>
                <div className={styles.entryBy}>
                  {brl(c.servicesTotal)} em serviços ·{' '}
                  {c.commissionRate === null
                    ? 'sem % definida'
                    : `${c.commissionRate}%`}
                </div>
              </div>
              <span className="tabularNums" style={{ fontWeight: 600 }}>
                {brl(c.commission)}
              </span>
            </div>
          ))}
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 12 }}>
            Base: todos os serviços do dia não cancelados. Mostra o valor a
            receber; o pagamento não é controlado aqui.
          </p>
        </Card>

        <Card>
          <div className={styles.caixaHeadRow}>
            <CardTitle>Despesas</CardTitle>
            <Button variant="primary" onClick={() => setDialogOpen(true)}>
              + Nova despesa
            </Button>
          </div>
          {expenses.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: 13 }}>
              Nenhuma despesa lançada.
            </p>
          ) : null}
          {expenses.map((e) => (
            <div key={e.id} className={styles.entryRow}>
              <span className={styles.entryTime}>
                {e.date.slice(8)}/{e.date.slice(5, 7)}
              </span>
              <div>
                <div className={styles.entryDesc}>{e.description}</div>
                <div className={styles.entryBy}>
                  {e.category ?? 'Sem categoria'}
                  {e.recurring ? ' · recorrente' : ''}
                </div>
              </div>
              <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  className="tabularNums"
                  style={{ color: 'var(--danger)', fontWeight: 600 }}
                >
                  − {brl(e.amount)}
                </span>
                <Button
                  variant="ghost"
                  onClick={() => handleRemoveExpense(e)}
                  aria-label={`Excluir ${e.description}`}
                >
                  ✕
                </Button>
              </span>
            </div>
          ))}
        </Card>
      </div>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Nova despesa"
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            marginBottom: 16,
          }}
        >
          <Field label="Descrição">
            <Input
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Ex.: Aluguel"
            />
          </Field>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 12,
            }}
          >
            <Field label="Categoria">
              <Input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
            </Field>
            <Field label="Valor (R$)">
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </Field>
            <Field label="Data">
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </Field>
          </div>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 14,
            }}
          >
            <input
              type="checkbox"
              checked={form.recurring}
              onChange={(e) =>
                setForm({ ...form, recurring: e.target.checked })
              }
            />
            Despesa recorrente
          </label>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button
            variant="primary"
            disabled={busy || !validExpense}
            onClick={handleCreateExpense}
          >
            Registrar
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
