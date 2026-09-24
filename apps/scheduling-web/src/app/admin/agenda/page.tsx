'use client';

import { Suspense, useEffect, useMemo, useState, type MouseEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '../_components/Button';
import { Chip } from '../_components/Chip';
import { Avatar } from '../_components/Avatar';
import { Dialog } from '../_components/Dialog';
import { Drawer } from '../_components/Drawer';
import { Field, Input, Select } from '../_components/Field';
import { StatusBadge } from '../_components/Badge';
import { Icon } from '../_lib/icons';
import { useAdminData } from '../_lib/data';
import { useNow } from '../_lib/use-now';
import { useViewport } from '../_lib/viewport';
import { useSetHeaderSubtitle } from '../_lib/page-header';
import { decorateAll, type DecoratedAppointment } from '../_lib/selectors';
import { freeSlotsForDay } from '../_lib/agenda';
import { brl, dateForOffset, ddmm, firstName, hm, longDayLabel, nowMinutes, shortDayLabel, WEEKDAYS_SHORT } from '../_lib/format';
import type { Barber } from '../_lib/types';
import styles from './page.module.css';

const DAY_START = 480; // 08:00
const DAY_END = 1200; // 20:00
const HOUR_PX = 64;
const DAY_HEIGHT = ((DAY_END - DAY_START) / 60) * HOUR_PX;

function topPx(minutes: number) {
  return ((minutes - DAY_START) / 60) * HOUR_PX;
}

type DialogState = {
  rescheduleId?: string;
  clientName: string;
  clientPhone: string;
  serviceId: string;
  barberId: string;
  dateOffset: number;
  start: number | null;
};

export default function AgendaPage() {
  return (
    <Suspense fallback={null}>
      <AgendaView />
    </Suspense>
  );
}

function AgendaView() {
  const { barbers, services, appointments, hours, createAppointment, setAppointmentStatus, showToast } = useAdminData();
  const { isMobile } = useViewport();
  const router = useRouter();
  const searchParams = useSearchParams();
  const now = useNow();

  const [dateOffset, setDateOffset] = useState(0);
  const [mobileBarberId, setMobileBarberId] = useState<string | undefined>(barbers[0]?.id);
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogState | null>(null);

  useSetHeaderSubtitle(shortDayLabel(dateOffset));

  const decorated = useMemo(() => decorateAll(appointments, services, barbers), [appointments, services, barbers]);

  function openNewDialog(opts: { barberId?: string; start?: number; dateOffset?: number }) {
    const barberId = opts.barberId ?? mobileBarberId ?? barbers[0]?.id;
    const offset = opts.dateOffset ?? dateOffset;
    const serviceId = services.find((s) => s.active)?.id ?? services[0]?.id ?? '';
    setDialog({ clientName: '', clientPhone: '', serviceId, barberId: barberId ?? '', dateOffset: offset, start: opts.start ?? null });
  }

  function openRescheduleDialog(appt: DecoratedAppointment) {
    setDrawerId(null);
    setDialog({
      rescheduleId: appt.id,
      clientName: appt.clientName,
      clientPhone: appt.clientPhone ?? '',
      serviceId: appt.serviceId,
      barberId: appt.barberId,
      dateOffset: appt.date,
      start: appt.start,
    });
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const barberParam = searchParams.get('barber');
    if (barberParam && barbers.some((b) => b.id === barberParam)) setMobileBarberId(barberParam);
    if (searchParams.get('new') === '1') {
      openNewDialog({ barberId: barberParam ?? undefined });
      router.replace('/admin/agenda');
    }
  }, []);

  const day = dateForOffset(dateOffset);
  const weekday = day.getDay();
  const isToday = dateOffset === 0;
  const nowMin = nowMinutes(now);
  const dayAppointments = decorated.filter((a) => a.date === dateOffset);
  const dayIsOpen = hours.find((h) => h.day === weekday)?.open ?? true;

  const visibleBarbers = isMobile ? barbers.filter((b) => b.id === mobileBarberId) : barbers;

  const dialogBarber = dialog ? barbers.find((b) => b.id === dialog.barberId) : undefined;
  const dialogService = dialog ? services.find((s) => s.id === dialog.serviceId) : undefined;

  const dialogSlots = useMemo(() => {
    if (!dialog || !dialogBarber || !dialogService) return [];
    const existing = decorated
      .filter((a) => a.barberId === dialog.barberId && a.date === dialog.dateOffset && a.id !== dialog.rescheduleId)
      .map((a) => ({ id: a.id, start: a.start, duration: a.service.duration }));
    return freeSlotsForDay({
      barber: dialogBarber,
      existingAppointments: existing,
      duration: dialogService.duration,
      dateOffset: dialog.dateOffset,
      skipAppointmentId: dialog.rescheduleId,
      now,
    });
  }, [dialog, dialogBarber, dialogService, decorated, now]);

  const effectiveStart = dialog?.start != null && dialogSlots.includes(dialog.start) ? dialog.start : (dialogSlots[0] ?? null);
  const canSave = !!dialog && dialog.clientName.trim().length > 0 && effectiveStart != null;

  function handleSave() {
    if (!dialog || effectiveStart == null || !dialog.clientName.trim() || !dialogBarber) return;
    createAppointment(
      {
        clientName: dialog.clientName,
        clientPhone: dialog.clientPhone || undefined,
        serviceId: dialog.serviceId,
        barberId: dialog.barberId,
        start: effectiveStart,
        date: dialog.dateOffset,
      },
      dialog.rescheduleId,
    );
    showToast(
      `${dialog.rescheduleId ? 'Remarcado' : 'Agendado'}: ${firstName(dialog.clientName)} às ${hm(effectiveStart)} com ${dialogBarber.short}`,
    );
    setDialog(null);
  }

  const hourMarks = [];
  for (let m = DAY_START; m < DAY_END; m += 60) hourMarks.push(m);

  const drawerAppt = drawerId ? decorated.find((a) => a.id === drawerId) : undefined;

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <button type="button" className={styles.navBtn} onClick={() => setDateOffset((d) => d - 1)} aria-label="Dia anterior">
            <Icon name="chevronLeft" size={18} />
          </button>
          <Button onClick={() => setDateOffset(0)}>Hoje</Button>
          <button type="button" className={styles.navBtn} onClick={() => setDateOffset((d) => d + 1)} aria-label="Próximo dia">
            <Icon name="chevronRight" size={18} />
          </button>
          <span className={styles.dateLabel}>{longDayLabel(dateOffset)}</span>
        </div>
        <Button variant="primary" onClick={() => openNewDialog({ dateOffset })}>
          <Icon name="plus" size={16} /> Novo agendamento
        </Button>
      </div>

      {!isMobile ? (
        <div className={styles.legend}>
          <span className={styles.legendItem}>
            <span className={styles.legendSwatch} style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent-line)' }} />
            Confirmado
          </span>
          <span className={styles.legendItem}>
            <span className={styles.legendSwatch} style={{ background: 'var(--surface)', border: '1px dashed var(--line-strong)' }} />
            Aguardando confirmação
          </span>
          <span className={styles.legendItem}>
            <span className={styles.legendSwatch} style={{ background: 'var(--surface-3)' }} />
            Concluído
          </span>
          <span className={styles.legendItem}>
            <span className={`${styles.legendSwatch} stripes-sm`} />
            Indisponível
          </span>
        </div>
      ) : (
        <div className={styles.chipsRow}>
          {barbers.map((b) => (
            <Chip key={b.id} active={mobileBarberId === b.id} onClick={() => setMobileBarberId(b.id)}>
              {b.short}
            </Chip>
          ))}
        </div>
      )}

      {!dayIsOpen ? (
        <div className={`${styles.closedCard} stripes`}>
          {weekday === 0 ? 'Fechado aos domingos.' : 'Fechado neste dia.'}
          <br />
          Altere em Configurações › Horários.
        </div>
      ) : (
        <>
          <div className={styles.gridWrap}>
            <div
              className={styles.gridInner}
              style={{ gridTemplateColumns: `56px repeat(${visibleBarbers.length}, minmax(${isMobile ? '0' : '168px'}, 1fr))` }}
            >
              <div className={styles.headerCorner} />
              {visibleBarbers.map((barber) => {
                const barberAppts = dayAppointments.filter((a) => a.barberId === barber.id);
                const booked = barberAppts.reduce((sum, a) => sum + a.service.duration, 0);
                const work = barber.end - barber.start - (barber.brk[1] - barber.brk[0]);
                const occPct = work > 0 ? Math.round((booked / work) * 100) : 0;
                return (
                  <div key={barber.id} className={styles.columnHeader}>
                    <Avatar initials={barber.initials} size={30} />
                    <div className={styles.columnHeaderInfo}>
                      <span className={styles.columnHeaderName}>{barber.short}</span>
                      <span className={styles.columnHeaderCount}>
                        {barberAppts.length} atend. · {occPct}%
                      </span>
                    </div>
                  </div>
                );
              })}

              <div className={styles.hourRuler} style={{ height: DAY_HEIGHT }}>
                {hourMarks.map((m) => (
                  <span key={m} className={styles.hourLabel} style={{ top: topPx(m) }}>
                    {hm(m)}
                  </span>
                ))}
                {isToday && nowMin >= DAY_START && nowMin <= DAY_END ? (
                  <span className={styles.nowLabel} style={{ top: topPx(nowMin) }}>
                    {hm(nowMin)}
                  </span>
                ) : null}
              </div>

              {visibleBarbers.map((barber) => (
                <AgendaColumn
                  key={barber.id}
                  barber={barber}
                  weekday={weekday}
                  isToday={isToday}
                  nowMin={nowMin}
                  appts={dayAppointments.filter((a) => a.barberId === barber.id)}
                  onEmptyClick={(minute) => openNewDialog({ barberId: barber.id, start: minute, dateOffset })}
                  onApptClick={(id) => setDrawerId(id)}
                />
              ))}
            </div>
          </div>

          {dayAppointments.length === 0 ? (
            <div className={styles.emptyDay}>Nenhum agendamento neste dia. Clique em um horário livre para agendar.</div>
          ) : null}
        </>
      )}

      <Drawer open={!!drawerAppt} onClose={() => setDrawerId(null)}>
        {drawerAppt ? (
          <>
            <div className={styles.drawerBadgeRow}>
              <StatusBadge status={drawerAppt.status} />
            </div>
            <p className={styles.drawerTime}>{drawerAppt.timeRangeLabel}</p>
            <p className={styles.drawerDate}>
              {drawerAppt.date === dateOffset ? longDayLabel(dateOffset) : ddmm(drawerAppt.date)}
            </p>
            <div className={styles.drawerGrid}>
              <div className={styles.drawerField}>
                <span className={styles.drawerLabel}>Cliente</span>
                <span className={styles.drawerValue}>{drawerAppt.clientName}</span>
              </div>
              {drawerAppt.clientPhone ? (
                <div className={styles.drawerField}>
                  <span className={styles.drawerLabel}>Telefone</span>
                  <span className={styles.drawerValue}>{drawerAppt.clientPhone}</span>
                </div>
              ) : null}
              <div className={styles.drawerField}>
                <span className={styles.drawerLabel}>Serviço</span>
                <span className={styles.drawerValue}>{drawerAppt.service.name}</span>
              </div>
              <div className={styles.drawerField}>
                <span className={styles.drawerLabel}>Barbeiro</span>
                <span className={styles.drawerValue}>{drawerAppt.barber.name}</span>
              </div>
              <div className={styles.drawerField}>
                <span className={styles.drawerLabel}>Valor</span>
                <span className={styles.drawerValue}>{drawerAppt.priceLabel}</span>
              </div>
            </div>
            <div className={styles.drawerActions}>
              {drawerAppt.status === 'pending' ? (
                <>
                  <Button
                    variant="primary"
                    onClick={() => {
                      setAppointmentStatus(drawerAppt.id, 'confirmed');
                      showToast(`Agendamento de ${firstName(drawerAppt.clientName)} confirmado`);
                      setDrawerId(null);
                    }}
                  >
                    Confirmar agendamento
                  </Button>
                  <Button onClick={() => showToast(`Lembrete enviado para ${firstName(drawerAppt.clientName)}`)}>
                    Enviar lembrete por WhatsApp
                  </Button>
                </>
              ) : null}
              {drawerAppt.status === 'confirmed' || drawerAppt.status === 'pending' ? (
                <Button onClick={() => openRescheduleDialog(drawerAppt)}>Remarcar</Button>
              ) : null}
            </div>
          </>
        ) : null}
      </Drawer>

      <Dialog
        open={!!dialog}
        onClose={() => setDialog(null)}
        title={dialog?.rescheduleId ? 'Remarcar agendamento' : 'Novo agendamento'}
        subtitle={dialog ? (dialog.dateOffset === 0 ? `Hoje, ${ddmm(0)}` : `${WEEKDAYS_SHORT[dateForOffset(dialog.dateOffset).getDay()]}, ${ddmm(dialog.dateOffset)}`) : undefined}
      >
        {dialog ? (
          <>
            <div className={styles.formRow}>
              <Field label="Nome do cliente">
                <Input
                  value={dialog.clientName}
                  onChange={(e) => setDialog({ ...dialog, clientName: e.target.value })}
                  placeholder="Nome completo"
                />
              </Field>
              <Field label="WhatsApp (opcional)">
                <Input
                  inputMode="tel"
                  value={dialog.clientPhone}
                  onChange={(e) => setDialog({ ...dialog, clientPhone: e.target.value })}
                  placeholder="(11) 90000-0000"
                />
              </Field>
            </div>
            <div className={styles.formCol}>
              <Field label="Serviço">
                <Select value={dialog.serviceId} onChange={(e) => setDialog({ ...dialog, serviceId: e.target.value, start: null })}>
                  {services
                    .filter((s) => s.active)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} · {s.duration} min · {brl(s.price)}
                      </option>
                    ))}
                </Select>
              </Field>
              <div className={styles.formRow} style={{ marginBottom: 0 }}>
                <Field label="Barbeiro">
                  <Select value={dialog.barberId} onChange={(e) => setDialog({ ...dialog, barberId: e.target.value, start: null })}>
                    {barbers.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Horário livre">
                  <Select
                    value={effectiveStart != null ? String(effectiveStart) : ''}
                    onChange={(e) => setDialog({ ...dialog, start: Number(e.target.value) })}
                    disabled={dialogSlots.length === 0}
                  >
                    {dialogSlots.length === 0 ? <option value="">Sem horários</option> : null}
                    {dialogSlots.map((slot) => (
                      <option key={slot} value={slot}>
                        {hm(slot)} – {hm(slot + (dialogService?.duration ?? 0))}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
            </div>

            {dialogSlots.length === 0 ? (
              <div className={styles.alertBox}>
                Sem horário livre para este serviço com este barbeiro neste dia. Troque o barbeiro ou o serviço.
              </div>
            ) : (
              <p className={styles.summary}>
                {dialogService?.name} com {dialogBarber?.short} · {brl(dialogService?.price ?? 0)}
              </p>
            )}

            <div className={styles.dialogActions}>
              <Button onClick={() => setDialog(null)}>Cancelar</Button>
              <Button variant="primary" disabled={!canSave} style={{ opacity: canSave ? 1 : 0.45 }} onClick={handleSave}>
                {dialog.rescheduleId ? 'Confirmar remarcação' : 'Confirmar agendamento'}
              </Button>
            </div>
          </>
        ) : null}
      </Dialog>
    </div>
  );
}

function AgendaColumn({
  barber,
  weekday,
  isToday,
  nowMin,
  appts,
  onEmptyClick,
  onApptClick,
}: {
  barber: Barber;
  weekday: number;
  isToday: boolean;
  nowMin: number;
  appts: DecoratedAppointment[];
  onEmptyClick: (minute: number) => void;
  onApptClick: (id: string) => void;
}) {
  const isOff = (barber.off as number[]).includes(weekday);

  const blocks: Array<{ top: number; height: number; label: string; show: boolean }> = [];
  if (isOff) {
    blocks.push({ top: 0, height: DAY_HEIGHT, label: 'Folga', show: true });
  } else {
    if (barber.start > DAY_START) {
      blocks.push({ top: 0, height: topPx(barber.start), label: 'Fora do expediente', show: true });
    }
    const breakHeight = ((barber.brk[1] - barber.brk[0]) / 60) * HOUR_PX;
    blocks.push({ top: topPx(barber.brk[0]), height: breakHeight, label: 'Intervalo', show: barber.brk[1] - barber.brk[0] >= 30 });
    if (barber.end < DAY_END) {
      blocks.push({ top: topPx(barber.end), height: topPx(DAY_END) - topPx(barber.end), label: 'Fora do expediente', show: true });
    }
  }

  function handleClick(e: MouseEvent<HTMLDivElement>) {
    if (isOff) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const minute = DAY_START + Math.floor(((e.clientY - rect.top) / HOUR_PX) * 4) * 15;
    onEmptyClick(minute);
  }

  return (
    <div className={styles.column} style={{ height: DAY_HEIGHT }} onClick={handleClick}>
      {blocks.map((block, i) => (
        <div key={i} className={`${styles.unavailable} stripes`} style={{ top: block.top, height: block.height }}>
          {block.show ? <span className={styles.unavailableLabel}>{block.label}</span> : null}
        </div>
      ))}

      {appts.map((appt) => {
        const height = ((appt.end - appt.start) / 60) * HOUR_PX - 3;
        const tall = height >= 40;
        const statusClass =
          appt.status === 'confirmed' ? styles.apptConfirmed : appt.status === 'pending' ? styles.apptPending : styles.apptDone;
        return (
          <button
            key={appt.id}
            type="button"
            className={`${styles.appt} ${statusClass}`}
            style={{
              top: topPx(appt.start) + 1,
              height,
              padding: tall ? '6px 8px' : '0 8px',
              fontSize: height >= 26 ? 13 : 10,
              lineHeight: height >= 26 ? 1.3 : 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: height >= 26 ? 'flex-start' : 'center',
            }}
            aria-label={`${appt.clientName}, ${appt.timeRangeLabel}, ${appt.service.name}, ${appt.status}`}
            onClick={(e) => {
              e.stopPropagation();
              onApptClick(appt.id);
            }}
          >
            <span className={styles.apptName}>{appt.clientName}</span>
            {tall ? (
              <span className={styles.apptSub}>
                {appt.timeRangeLabel} · {appt.service.name}
              </span>
            ) : null}
          </button>
        );
      })}

      {isToday && nowMin >= DAY_START && nowMin <= DAY_END ? <div className={styles.nowLine} style={{ top: topPx(nowMin) }} /> : null}
    </div>
  );
}
