'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { Card, CardTitle } from '../_components/Card';
import { Kpi } from '../_components/Kpi';
import { Button } from '../_components/Button';
import { Avatar } from '../_components/Avatar';
import { Icon } from '../_lib/icons';
import { useAdminData } from '../_lib/data';
import { useShop } from '../_lib/shop';
import { useNow } from '../_lib/use-now';
import { decorateAll, WEEKDAY_REVENUE_DEMO } from '../_lib/selectors';
import { brl, brl0, dateForOffset, firstName, greetingFor, hm, longDayLabel, nowMinutes, WEEKDAYS_SHORT } from '../_lib/format';
import { AVERAGE_TICKET_MONTH } from '../_lib/mock-data';
import styles from './page.module.css';

export default function DashboardPage() {
  const { barbers, services, appointments, stock, remindersSent, sendPendingReminders, showToast } = useAdminData();
  const { shop } = useShop();
  const router = useRouter();
  const now = useNow();
  const nowMin = nowMinutes(now);

  const today = useMemo(() => decorateAll(appointments.filter((a) => a.date === 0), services, barbers), [appointments, services, barbers]);
  const doneToday = today.filter((a) => a.status === 'done');
  const realized = doneToday.reduce((sum, a) => sum + a.service.price, 0);
  const forecast = today.reduce((sum, a) => sum + a.service.price, 0);
  const pendingToday = today.filter((a) => a.status === 'pending');

  const kpis = [
    {
      label: 'Faturamento realizado',
      value: brl(realized),
      sub: `de ${brl(forecast)} previstos hoje`,
      progressPct: forecast > 0 ? (realized / forecast) * 100 : 0,
    },
    {
      label: 'Atendimentos',
      value: `${doneToday.length} de ${today.length}`,
      sub: 'concluídos até agora',
    },
    {
      label: 'Ticket médio',
      value: brl(doneToday.length ? realized / doneToday.length : 0),
      sub: `média do mês: ${brl(AVERAGE_TICKET_MONTH)}`,
    },
  ];

  const chairs = barbers.map((barber) => {
    const mine = today.filter((a) => a.barberId === barber.id);
    const current = mine.find((a) => a.start <= nowMin && a.end > nowMin && a.status === 'confirmed');
    const onBreak = nowMin >= barber.brk[0] && nowMin < barber.brk[1];
    const next = mine.filter((a) => a.start > nowMin && a.status !== 'done').sort((a, b) => a.start - b.start)[0];

    let state: 'Atendendo' | 'Intervalo' | 'Livre' = 'Livre';
    let line = 'Cadeira livre';
    let sub = next ? `próximo às ${next.timeLabel} · ${firstName(next.clientName)}` : 'sem próximos hoje';
    let progressPct: number | null = null;

    if (current) {
      state = 'Atendendo';
      line = current.clientName;
      sub = `${current.service.name} · termina ${hm(current.end)}`;
      progressPct = Math.min(100, ((nowMin - current.start) / (current.end - current.start)) * 100);
    } else if (onBreak) {
      state = 'Intervalo';
      line = 'Intervalo';
      sub = `volta às ${hm(barber.brk[1])}`;
    }

    return { barber, state, line, sub, progressPct, busy: state === 'Atendendo' };
  });

  const lowStock = stock.filter((item) => item.qty < item.min);
  const alerts: Array<{ icon: 'msg' | 'alert'; title: string; text: string; action: string; run: () => void }> = [];
  if (pendingToday.length) {
    alerts.push({
      icon: 'msg',
      title: `${pendingToday.length} agendamentos aguardando confirmação`,
      text: remindersSent
        ? `Lembretes enviados por WhatsApp às ${hm(nowMin)}.`
        : pendingToday.map((a) => `${a.timeLabel} ${firstName(a.clientName)}`).join(' · '),
      action: remindersSent ? 'Ver na agenda' : 'Enviar lembretes',
      run: () => {
        if (remindersSent) {
          router.push('/admin/agenda');
        } else {
          sendPendingReminders();
          showToast(`Lembretes enviados para ${pendingToday.length} clientes via WhatsApp`);
        }
      },
    });
  }
  if (lowStock.length) {
    alerts.push({
      icon: 'alert',
      title: `${lowStock.length} itens abaixo do estoque mínimo`,
      text: lowStock.map((s) => s.name).join(', '),
      action: 'Ver estoque',
      run: () => router.push('/admin/estoque'),
    });
  }

  const upcoming = today
    .filter((a) => a.start >= nowMin - 30 && a.status !== 'done')
    .sort((a, b) => a.start - b.start)
    .slice(0, 6);

  const week = Array.from({ length: 7 }, (_, i) => -6 + i).map((offset) => {
    const day = dateForOffset(offset);
    const weekday = day.getDay();
    const isToday = offset === 0;
    const closed = weekday === 0;
    const value = isToday ? realized : closed ? 0 : WEEKDAY_REVENUE_DEMO[weekday];
    const max = Math.max(...WEEKDAY_REVENUE_DEMO, realized, 1);
    return {
      label: WEEKDAYS_SHORT[weekday],
      value,
      isToday,
      closed,
      heightPct: Math.max(4, (value / max) * 100),
    };
  });

  const greeting = `${greetingFor(now.getHours())}, ${firstName(shop.owner.name)}.`;
  const dateLine = `${longDayLabel(0)} · ${hm(nowMin)}`;

  return (
    <div className={styles.page}>
      <div className={styles.top}>
        <div>
          <h2 className={styles.greeting}>{greeting}</h2>
          <p className={styles.dateLine}>{dateLine}</p>
        </div>
        <Button variant="primary" onClick={() => router.push('/admin/agenda?new=1')}>
          <Icon name="plus" size={16} /> Novo agendamento
        </Button>
      </div>

      <div className={styles.kpis}>
        {kpis.map((kpi) => (
          <Kpi key={kpi.label} {...kpi} />
        ))}
      </div>

      <div className={styles.panels}>
        <Card>
          <CardTitle>Agora nas cadeiras</CardTitle>
          <div className={styles.chairList}>
            {chairs.map((c) => (
              <button
                key={c.barber.id}
                type="button"
                className={styles.chairRow}
                onClick={() => router.push(`/admin/agenda?barber=${c.barber.id}`)}
              >
                <Avatar initials={c.barber.initials} size={28} />
                <div className={styles.chairInfo}>
                  <div className={styles.chairNameRow}>
                    <span className={styles.chairName}>{c.barber.short}</span>
                    <span className={styles.dot} style={{ background: c.busy ? 'var(--accent)' : 'var(--faint)' }} />
                    <span className={styles.chairState}>{c.state}</span>
                  </div>
                  <span className={styles.chairLine}>{c.line}</span>
                  <span className={styles.chairSub}>{c.sub}</span>
                  {c.progressPct != null ? (
                    <div className={styles.progress}>
                      <div className={styles.progressFill} style={{ width: c.progressPct + '%' }} />
                    </div>
                  ) : null}
                </div>
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <CardTitle>Pendências</CardTitle>
          {alerts.length ? (
            <div className={styles.alertList}>
              {alerts.map((alert) => (
                <div key={alert.title} className={styles.alertRow}>
                  <Icon name={alert.icon} size={18} className={styles.alertIcon} />
                  <div className={styles.alertBody}>
                    <span className={styles.alertTitle}>{alert.title}</span>
                    <span className={styles.alertText}>{alert.text}</span>
                  </div>
                  <Button onClick={alert.run} className={styles.alertBtn}>
                    {alert.action}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.emptyState}>Nada pendente. Tudo em dia.</p>
          )}
        </Card>

        <Card>
          <CardTitle>Próximos atendimentos</CardTitle>
          {upcoming.length ? (
            <div>
              {upcoming.map((a) => (
                <Link key={a.id} href="/admin/agenda" className={styles.upcomingRow}>
                  <span className={styles.upcomingTime}>{a.timeLabel}</span>
                  <div className={styles.upcomingInfo}>
                    <span className={styles.upcomingClient}>
                      {a.clientName} · {a.service.name}
                    </span>
                    <span className={styles.upcomingSub}>{a.barber.short}</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className={styles.emptyState}>Nenhum atendimento a seguir hoje.</p>
          )}
        </Card>

        <Card>
          <CardTitle>Faturamento · últimos 7 dias</CardTitle>
          <div className={styles.weekChart}>
            {week.map((day, i) => (
              <div key={i} className={styles.weekBarWrap}>
                <span className={styles.weekValue}>{day.closed ? '' : brl0(day.value)}</span>
                <div
                  className={[styles.weekBar, day.closed ? 'stripes' : ''].join(' ')}
                  style={{
                    height: day.heightPct + '%',
                    background: day.closed ? undefined : day.isToday ? 'var(--accent-bg)' : 'var(--surface-3)',
                  }}
                />
                <span className={styles.weekLabel} style={{ fontWeight: day.isToday ? 700 : 500 }}>
                  {day.closed ? 'Fechado' : day.label}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
