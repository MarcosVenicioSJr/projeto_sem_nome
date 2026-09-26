import { describe, expect, it } from 'vitest';
import { computeFreeSlots, freeSlotsForDay } from './agenda';

describe('computeFreeSlots', () => {
  const base = {
    barberStart: 480, // 08:00
    barberEnd: 720, // 12:00
    barberBreak: [600, 630] as [number, number], // 10:00-10:30
    isClosed: false,
    busy: [] as [number, number][],
    duration: 45,
  };

  it('retorna slots de 15 em 15 minutos dentro do expediente', () => {
    const slots = computeFreeSlots(base);
    expect(slots[0]).toBe(480);
    expect(slots.every((s) => (s - 480) % 15 === 0)).toBe(true);
    expect(slots.every((s) => s + 45 <= 720)).toBe(true);
  });

  it('remove slots que colidem com o intervalo do barbeiro', () => {
    const slots = computeFreeSlots(base);
    expect(slots.some((s) => s === 600)).toBe(false);
    // um agendamento de 45min iniciando às 10:00 (600) terminaria 10:45,
    // então nenhum slot deve começar entre 555 (10:00-45) exclusive e 630
    expect(slots.every((s) => s + 45 <= 600 || s >= 630)).toBe(true);
  });

  it('remove slots que colidem com outros agendamentos', () => {
    const slots = computeFreeSlots({ ...base, busy: [[480, 525]] }); // 08:00-08:45 ocupado
    expect(slots).not.toContain(480);
    expect(slots).not.toContain(495);
    expect(slots).toContain(525);
  });

  it('retorna vazio quando o barbeiro está de folga/fechado', () => {
    expect(computeFreeSlots({ ...base, isClosed: true })).toEqual([]);
  });

  it('respeita o horário mínimo permitido (minStart)', () => {
    const slots = computeFreeSlots({ ...base, minStart: 540 });
    expect(slots.every((s) => s >= 540)).toBe(true);
  });

  it('não gera slot algum quando a duração é maior que o expediente', () => {
    expect(computeFreeSlots({ ...base, duration: 999 })).toEqual([]);
  });
});

describe('freeSlotsForDay', () => {
  const barber = {
    start: 480,
    end: 1140,
    brk: [735, 795] as [number, number],
    off: [0],
  };
  const today = new Date(2026, 8, 23); // quarta-feira, 23/09/2026

  it('ignora o próprio agendamento ao remarcar', () => {
    const existing = [{ id: 'a1', start: 900, duration: 45 }];
    const withoutSkip = freeSlotsForDay({
      barber,
      existingAppointments: existing,
      duration: 45,
      dateOffset: 1,
      today,
    });
    const withSkip = freeSlotsForDay({
      barber,
      existingAppointments: existing,
      duration: 45,
      dateOffset: 1,
      skipAppointmentId: 'a1',
      today,
    });
    expect(withoutSkip).not.toContain(900);
    expect(withSkip).toContain(900);
  });

  it('não libera horários em dias de folga do barbeiro (domingo)', () => {
    // 2026-09-27 é um domingo; barbeiro está de folga aos domingos (off: [0])
    const slots = freeSlotsForDay({
      barber,
      existingAppointments: [],
      duration: 30,
      dateOffset: 4,
      today,
    });
    expect(slots).toEqual([]);
  });

  it('não libera horários em dias passados', () => {
    const slots = freeSlotsForDay({
      barber,
      existingAppointments: [],
      duration: 30,
      dateOffset: -1,
      today,
    });
    expect(slots).toEqual([]);
  });

  it('no dia de hoje, respeita a folga mínima a partir de agora', () => {
    const now = new Date(2026, 8, 23, 14, 20); // 14:20
    const slots = freeSlotsForDay({
      barber,
      existingAppointments: [],
      duration: 30,
      dateOffset: 0,
      now,
      today,
    });
    // 14:20 + 10min = 14:30 = 870min; o primeiro slot de 15 em 15 >= 870 é 870
    expect(slots[0]).toBeGreaterThanOrEqual(870);
  });
});
