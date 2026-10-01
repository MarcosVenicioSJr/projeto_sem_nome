'use client';

import { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '../_components/Card';
import { Avatar } from '../_components/Avatar';
import { Button } from '../_components/Button';
import { Tabs } from '../_components/Tabs';
import { Table, type Column } from '../_components/Table';
import { Dialog } from '../_components/Dialog';
import { Field, Input, Select } from '../_components/Field';
import type { ScheduleDay } from '@org/contracts';
import { useSession } from '../../_lib/session';
import { useAdminData, type NewMemberInput } from '../_lib/data';
import { useNow } from '../_lib/use-now';
import {
  decorateAll,
  barberLiveState,
  barberOccupancyPct,
} from '../_lib/selectors';
import {
  brl,
  brl0,
  ddmm,
  hm,
  nowMinutes,
  WEEKDAYS_SHORT,
} from '../_lib/format';
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
  const [tab, setTab] = useState<TeamTab>(
    ['barbeiros', 'horarios', 'comissoes'].includes(initialTab)
      ? initialTab
      : 'barbeiros',
  );

  const {
    barbers,
    services,
    appointments,
    commissionPct,
    commissionPaid,
    setCommissionPct,
    payCommission,
    showToast,
    loading,
    loadError,
    schedules,
    createMember,
    saveSchedule,
  } = useAdminData();
  const { me, isManagement } = useSession();
  const [newOpen, setNewOpen] = useState(false);
  const [scheduleFor, setScheduleFor] = useState<Barber | null>(null);
  const router = useRouter();
  const now = useNow();
  const nowMin = nowMinutes(now);

  const decorated = useMemo(
    () => decorateAll(appointments, services, barbers),
    [appointments, services, barbers],
  );
  const today = decorated.filter((a) => a.date === 0);

  return (
    <div className={styles.page}>
      <Tabs
        items={[
          { key: 'barbeiros', label: 'Profissionais' },
          { key: 'horarios', label: 'Horários' },
          { key: 'comissoes', label: 'Comissões' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {loadError ? (
        <p style={{ color: 'var(--danger)', fontSize: 13 }}>{loadError}</p>
      ) : null}
      {loading ? (
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>Carregando…</p>
      ) : null}

      {tab === 'barbeiros' && isManagement ? (
        <div>
          <Button variant="primary" onClick={() => setNewOpen(true)}>
            + Novo profissional
          </Button>
        </div>
      ) : null}

      {tab === 'barbeiros' ? (
        <div className={styles.cards}>
          {barbers.map((barber) => {
            const live = barberLiveState(barber, today, nowMin);
            const todayCount = today.filter(
              (a) => a.barberId === barber.id,
            ).length;
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
                  <span
                    className={styles.dot}
                    style={{
                      background: live.busy ? 'var(--accent)' : 'var(--faint)',
                    }}
                  />
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
                    <span className={styles.metricValue}>
                      {commissionPct[barber.id]}%
                    </span>
                  </div>
                </div>
                <Button
                  style={{ width: '100%' }}
                  onClick={() =>
                    router.push(`/admin/agenda?barber=${barber.id}`)
                  }
                >
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
                <th>Profissional</th>
                {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                  <th key={d}>{WEEKDAYS_SHORT[d]}</th>
                ))}
                <th>Intervalo</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {barbers.map((barber) => {
                const week = schedules[barber.id] ?? [];
                const withBreak = week.find(
                  (d) => d.breakStartMinute != null && d.breakEndMinute != null,
                );
                return (
                  <tr key={barber.id}>
                    <td>{barber.name}</td>
                    {[1, 2, 3, 4, 5, 6, 0].map((d) => {
                      const day = week.find((w) => w.weekday === d);
                      return (
                        <td key={d} className={day ? undefined : styles.off}>
                          {day
                            ? `${hm(day.startMinute)}–${hm(day.endMinute)}`
                            : 'Folga'}
                        </td>
                      );
                    })}
                    <td>
                      {withBreak
                        ? `${hm(withBreak.breakStartMinute as number)}–${hm(withBreak.breakEndMinute as number)}`
                        : '—'}
                    </td>
                    <td>
                      {isManagement || me?.id === barber.id ? (
                        <Button onClick={() => setScheduleFor(barber)}>
                          Editar
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
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

      <NewMemberDialog
        open={newOpen}
        onClose={() => setNewOpen(false)}
        onCreate={async (input) => {
          await createMember(input);
          showToast(`${input.name} foi adicionado à equipe`);
        }}
      />
      <ScheduleDialog
        barber={scheduleFor}
        week={scheduleFor ? (schedules[scheduleFor.id] ?? []) : []}
        onClose={() => setScheduleFor(null)}
        onSave={async (id, days) => {
          await saveSchedule(id, days);
          showToast('Horários atualizados');
        }}
      />
    </div>
  );
}

const EMPTY_MEMBER = {
  name: '',
  email: '',
  phone: '',
  password: '',
  role: 'employee' as 'employee' | 'manager',
  commission: '40',
};

function NewMemberDialog({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (input: NewMemberInput) => Promise<void>;
}) {
  const [form, setForm] = useState(EMPTY_MEMBER);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const valid =
    form.name.trim().length >= 2 &&
    form.email.includes('@') &&
    form.phone.length === 11 &&
    form.password.length >= 8;

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await onCreate({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone,
        password: form.password,
        role: form.role,
        commissionRate:
          form.role === 'employee' && form.commission !== ''
            ? Number(form.commission)
            : null,
      });
      setForm(EMPTY_MEMBER);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível cadastrar.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Novo profissional">
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          marginBottom: 16,
        }}
      >
        <Field label="Nome">
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </Field>
        <Field label="E-mail (será o login)">
          <Input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </Field>
        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}
        >
          <Field label="Telefone (com DDD)">
            <Input
              inputMode="numeric"
              value={form.phone}
              onChange={(e) =>
                setForm({
                  ...form,
                  phone: e.target.value.replace(/\D/g, '').slice(0, 11),
                })
              }
            />
          </Field>
          <Field
            label="Senha inicial"
            hint="8+ caracteres, com maiúscula, minúscula e número"
          >
            <Input
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </Field>
        </div>
        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}
        >
          <Field label="Papel">
            <Select
              value={form.role}
              onChange={(e) =>
                setForm({
                  ...form,
                  role: e.target.value as 'employee' | 'manager',
                })
              }
            >
              <option value="employee">Profissional</option>
              <option value="manager">Gerente</option>
            </Select>
          </Field>
          {form.role === 'employee' ? (
            <Field label="Comissão (%)">
              <Input
                type="number"
                min={0}
                max={100}
                value={form.commission}
                onChange={(e) =>
                  setForm({ ...form, commission: e.target.value })
                }
              />
            </Field>
          ) : null}
        </div>
        {error ? (
          <p style={{ color: 'var(--danger)', fontSize: 13, margin: 0 }}>
            {error}
          </p>
        ) : null}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="primary" disabled={busy || !valid} onClick={submit}>
          Cadastrar
        </Button>
      </div>
    </Dialog>
  );
}

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};
const toHHMM = (min: number) =>
  `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

type DayDraft = { weekday: number; on: boolean; from: string; to: string };

function ScheduleDialog({
  barber,
  week,
  onClose,
  onSave,
}: {
  barber: Barber | null;
  week: ScheduleDay[];
  onClose: () => void;
  onSave: (id: string, days: ScheduleDay[]) => Promise<void>;
}) {
  const [days, setDays] = useState<DayDraft[]>([]);
  const [hasBreak, setHasBreak] = useState(true);
  const [breakFrom, setBreakFrom] = useState('12:00');
  const [breakTo, setBreakTo] = useState('13:00');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  // (re)inicializa o rascunho ao abrir para outro profissional
  if (barber && loadedFor !== barber.id) {
    const withBreak = week.find(
      (d) => d.breakStartMinute != null && d.breakEndMinute != null,
    );
    setLoadedFor(barber.id);
    setError(null);
    setHasBreak(week.length === 0 || !!withBreak);
    setBreakFrom(toHHMM(withBreak?.breakStartMinute ?? 720));
    setBreakTo(toHHMM(withBreak?.breakEndMinute ?? 780));
    setDays(
      [1, 2, 3, 4, 5, 6, 0].map((weekday) => {
        const d = week.find((w) => w.weekday === weekday);
        return {
          weekday,
          on: d ? true : week.length === 0 && weekday !== 0,
          from: toHHMM(d?.startMinute ?? 540),
          to: toHHMM(d?.endMinute ?? 1080),
        };
      }),
    );
  }
  if (!barber && loadedFor !== null) setLoadedFor(null);

  const invalid =
    days.some((d) => d.on && toMinutes(d.from) >= toMinutes(d.to)) ||
    (hasBreak && toMinutes(breakFrom) >= toMinutes(breakTo));

  async function submit() {
    if (!barber) return;
    setBusy(true);
    setError(null);
    try {
      await onSave(
        barber.id,
        days
          .filter((d) => d.on)
          .map((d) => ({
            weekday: d.weekday,
            startMinute: toMinutes(d.from),
            endMinute: toMinutes(d.to),
            breakStartMinute: hasBreak ? toMinutes(breakFrom) : null,
            breakEndMinute: hasBreak ? toMinutes(breakTo) : null,
          })),
      );
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível salvar.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={barber !== null}
      onClose={onClose}
      title={barber ? `Horários de ${barber.name}` : ''}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          marginBottom: 16,
        }}
      >
        {days.map((d, i) => (
          <div
            key={d.weekday}
            style={{
              display: 'grid',
              gridTemplateColumns: '110px 1fr 1fr',
              alignItems: 'center',
              gap: 10,
            }}
          >
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
                checked={d.on}
                onChange={(e) =>
                  setDays(
                    days.map((x, j) =>
                      j === i ? { ...x, on: e.target.checked } : x,
                    ),
                  )
                }
              />
              {WEEKDAYS_SHORT[d.weekday]}
            </label>
            <Input
              type="time"
              disabled={!d.on}
              value={d.from}
              onChange={(e) =>
                setDays(
                  days.map((x, j) =>
                    j === i ? { ...x, from: e.target.value } : x,
                  ),
                )
              }
              aria-label={`Início ${WEEKDAYS_SHORT[d.weekday]}`}
            />
            <Input
              type="time"
              disabled={!d.on}
              value={d.to}
              onChange={(e) =>
                setDays(
                  days.map((x, j) =>
                    j === i ? { ...x, to: e.target.value } : x,
                  ),
                )
              }
              aria-label={`Fim ${WEEKDAYS_SHORT[d.weekday]}`}
            />
          </div>
        ))}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '110px 1fr 1fr',
            alignItems: 'center',
            gap: 10,
            marginTop: 6,
          }}
        >
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
              checked={hasBreak}
              onChange={(e) => setHasBreak(e.target.checked)}
            />
            Intervalo
          </label>
          <Input
            type="time"
            disabled={!hasBreak}
            value={breakFrom}
            onChange={(e) => setBreakFrom(e.target.value)}
            aria-label="Início do intervalo"
          />
          <Input
            type="time"
            disabled={!hasBreak}
            value={breakTo}
            onChange={(e) => setBreakTo(e.target.value)}
            aria-label="Fim do intervalo"
          />
        </div>
        <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>
          O intervalo vale para todos os dias marcados. Dias desmarcados são
          folga.
        </p>
        {error ? (
          <p style={{ color: 'var(--danger)', fontSize: 13, margin: 0 }}>
            {error}
          </p>
        ) : null}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="primary" disabled={busy || invalid} onClick={submit}>
          Salvar
        </Button>
      </div>
    </Dialog>
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
  const total = rows
    .filter((r) => !r.paid)
    .reduce((sum, r) => sum + r.commission, 0);

  const cols: Column<(typeof rows)[number]>[] = [
    { key: 'name', header: 'Profissional', render: (r) => r.name },
    {
      key: 'pct',
      header: '% fixa',
      align: 'center',
      render: (r) => (
        <div className={styles.stepper}>
          <button
            type="button"
            className={styles.stepBtn}
            onClick={() => setCommissionPct(r.id, r.pct - 5)}
            aria-label={`Diminuir % de ${r.name}`}
          >
            −
          </button>
          <span className="tabularNums">{r.pct}%</span>
          <button
            type="button"
            className={styles.stepBtn}
            onClick={() => setCommissionPct(r.id, r.pct + 5)}
            aria-label={`Aumentar % de ${r.name}`}
          >
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
          <span style={{ color: 'var(--ok)', fontSize: 12, fontWeight: 600 }}>
            ✓ Pago em {ddmm(0)}
          </span>
        ) : (
          <Button
            onClick={() => {
              payCommission(r.id);
              showToast(
                `Pagamento de ${brl(r.commission)} registrado para ${r.short}`,
              );
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
        A % fixa vale para todos os serviços do profissional. Venda de produtos
        não entra na comissão.
      </p>
    </Card>
  );
}
