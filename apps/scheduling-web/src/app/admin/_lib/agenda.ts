import { dateForOffset } from './format';
import type { Appointment, Barber } from './types';

/** Intervalo ocupado, em minutos desde 00:00: [início, fim). */
export type BusyRange = [number, number];

export interface ComputeFreeSlotsInput {
  /** início do expediente do barbeiro, em minutos desde 00:00 */
  barberStart: number;
  /** fim do expediente do barbeiro, em minutos desde 00:00 */
  barberEnd: number;
  /** intervalo de almoço/descanso do barbeiro */
  barberBreak: BusyRange;
  /** true quando o barbeiro não atende nesse dia (folga) ou o dia já passou */
  isClosed: boolean;
  /** agendamentos já existentes do barbeiro nesse dia (exclui o próprio, em uma remarcação) */
  busy: BusyRange[];
  /** duração do serviço, em minutos */
  duration: number;
  /** passo entre horários, em minutos (padrão: 15) */
  step?: number;
  /** menor horário permitido, em minutos (ex.: agora + 10min, só no dia de hoje) */
  minStart?: number;
}

/**
 * Calcula os horários livres (em minutos desde 00:00) de 15 em 15 minutos,
 * respeitando expediente, intervalo, folga, conflitos com outros
 * agendamentos e o horário mínimo permitido. Função pura — sem acesso a
 * relógio, estado ou APIs — para ser fácil de testar.
 */
export function computeFreeSlots(input: ComputeFreeSlotsInput): number[] {
  const {
    barberStart,
    barberEnd,
    barberBreak,
    isClosed,
    busy,
    duration,
    step = 15,
    minStart,
  } = input;
  if (isClosed || duration <= 0) return [];

  const ranges: BusyRange[] = [...busy, barberBreak];
  const out: number[] = [];

  for (let start = barberStart; start + duration <= barberEnd; start += step) {
    if (minStart != null && start < minStart) continue;
    const overlaps = ranges.some(
      ([busyStart, busyEnd]) => start < busyEnd && start + duration > busyStart,
    );
    if (overlaps) continue;
    out.push(start);
  }
  return out;
}

export interface FreeSlotsForDayParams {
  barber: Pick<Barber, 'start' | 'end' | 'brk' | 'off'>;
  /** agendamentos existentes do barbeiro nesse dia, já com a duração resolvida */
  existingAppointments: Array<
    Pick<Appointment, 'id' | 'start'> & { duration: number }
  >;
  /** duração do serviço que se quer agendar, em minutos */
  duration: number;
  /** deslocamento em dias a partir de hoje (0 = hoje) */
  dateOffset: number;
  /** ignora este agendamento ao calcular conflitos (usado em remarcações) */
  skipAppointmentId?: string;
  /** minutos-tolerância antes de permitir marcar "agora", só no dia de hoje (padrão: 10) */
  leadMinutes?: number;
  /** hora de referência para "agora"; injetável para testes */
  now?: Date;
  /** data de referência para "hoje"; injetável para testes */
  today?: Date;
}

/**
 * Conveniência sobre `computeFreeSlots` que resolve dia da semana, folga e
 * conflitos a partir da lista de agendamentos e dos dados do barbeiro.
 */
export function freeSlotsForDay({
  barber,
  existingAppointments,
  duration,
  dateOffset,
  skipAppointmentId,
  leadMinutes = 10,
  now = new Date(),
  today,
}: FreeSlotsForDayParams): number[] {
  const day = dateForOffset(dateOffset, today);
  const weekday = day.getDay();
  const isPast = dateOffset < 0;
  const isOff = (barber.off as number[]).includes(weekday);

  const busy: BusyRange[] = existingAppointments
    .filter((a) => a.id !== skipAppointmentId)
    .map((a) => [a.start, a.start + a.duration] as BusyRange);

  const minStart = dateOffset === 0 ? nowPlus(now, leadMinutes) : undefined;

  return computeFreeSlots({
    barberStart: barber.start,
    barberEnd: barber.end,
    barberBreak: barber.brk,
    isClosed: isPast || isOff,
    busy,
    duration,
    minStart,
  });
}

function nowPlus(now: Date, minutes: number): number {
  return now.getHours() * 60 + now.getMinutes() + minutes;
}
