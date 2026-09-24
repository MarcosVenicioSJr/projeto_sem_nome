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
  const end = appt.start + service.duration;
  return {
    ...appt,
    service,
    barber,
    end,
    timeLabel: hm(appt.start),
    timeRangeLabel: `${hm(appt.start)}–${hm(end)}`,
    priceLabel: brl(service.price),
  };
}

export function decorateAll(appts: Appointment[], services: Service[], barbers: Barber[]): DecoratedAppointment[] {
  return appts.map((a) => decorateAppointment(a, services, barbers)).filter((a): a is DecoratedAppointment => a != null);
}

/** Receita representativa por dia da semana, usada só para preencher o
 * gráfico "últimos 7 dias" do Dashboard quando ainda não há histórico real
 * de faturamento. domingo = fechado. */
export const WEEKDAY_REVENUE_DEMO = [0, 1250, 1680, 2100, 1840, 2960, 3420];
