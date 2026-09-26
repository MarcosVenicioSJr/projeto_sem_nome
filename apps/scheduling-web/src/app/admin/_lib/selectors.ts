import { brl, hm } from './format';
import type { Appointment, Barber, Service } from './types';

export type DecoratedAppointment = Appointment & {
  service: Service;
  barber: Barber;
  end: number;
  timeLabel: string;
  timeRangeLabel: string;
  priceLabel: string;
};

/** Enriquece um agendamento com o serviço e o barbeiro correspondentes; retorna `null` se algum dos dois não existir mais. */
export function decorateAppointment(
  appt: Appointment,
  services: Service[],
  barbers: Barber[],
): DecoratedAppointment | null {
  const service = services.find((s) => s.id === appt.serviceId);
  const barber = barbers.find((b) => b.id === appt.barberId);
  if (!service || !barber) return null;
  const end = appt.start + (appt.durationMinutes ?? service.duration);
  return {
    ...appt,
    service,
    barber,
    end,
    timeLabel: hm(appt.start),
    timeRangeLabel: `${hm(appt.start)}–${hm(end)}`,
    priceLabel: brl(appt.price ?? service.price),
  };
}

export function decorateAll(appts: Appointment[], services: Service[], barbers: Barber[]): DecoratedAppointment[] {
  return appts.map((a) => decorateAppointment(a, services, barbers)).filter((a): a is DecoratedAppointment => a != null);
}

/** Receita representativa por dia da semana, usada só para preencher o
 * gráfico "últimos 7 dias" do Dashboard quando ainda não há histórico real
 * de faturamento. domingo = fechado. */
export const WEEKDAY_REVENUE_DEMO = [0, 1250, 1680, 2100, 1840, 2960, 3420];

export type BarberLiveState = {
  state: 'Atendendo' | 'Intervalo' | 'Livre';
  busy: boolean;
  current?: DecoratedAppointment;
};

/** Estado ao vivo de um barbeiro (usado no Dashboard e em Equipe). */
export function barberLiveState(barber: Barber, todayAppts: DecoratedAppointment[], nowMin: number): BarberLiveState {
  const mine = todayAppts.filter((a) => a.barberId === barber.id);
  const current = mine.find((a) => a.start <= nowMin && a.end > nowMin && a.status === 'confirmed');
  if (current) return { state: 'Atendendo', busy: true, current };
  const onBreak = nowMin >= barber.brk[0] && nowMin < barber.brk[1];
  if (onBreak) return { state: 'Intervalo', busy: false };
  return { state: 'Livre', busy: false };
}

/** Ocupação do dia (%) de um barbeiro, a partir dos agendamentos do dia. */
export function barberOccupancyPct(barber: Barber, dayAppts: DecoratedAppointment[]): number {
  const booked = dayAppts.filter((a) => a.barberId === barber.id).reduce((sum, a) => sum + (a.end - a.start), 0);
  const work = barber.end - barber.start - (barber.brk[1] - barber.brk[0]);
  return work > 0 ? Math.round((booked / work) * 100) : 0;
}
