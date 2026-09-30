'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { mergeSlots } from '../booking';
import { gateway } from '../gateway';

export type Slot = { startAt: string; proId: string };
export type DaySlots =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; slots: Slot[] };

const CONCURRENCY = 4;

/**
 * Horários livres de vários dias de uma vez, para a faixa de datas já
 * mostrar quais dias têm vaga. Com mais de um profissional ("primeiro
 * disponível"), junta os horários de todos.
 */
export function useDaySlots(
  slug: string,
  proIds: string[],
  serviceIds: string[],
  days: string[],
) {
  const [byDay, setByDay] = useState<Record<string, DaySlots>>({});
  const [version, setVersion] = useState(0);
  const cache = useRef(new Map<string, Slot[]>());
  const key = `${proIds.join(',')}|${serviceIds.join(',')}`;
  const daysKey = days.join(',');

  /** Descarta o cache de um dia (ex.: alguém pegou o horário antes). */
  const invalidate = useCallback(
    (date: string) => {
      cache.current.delete(`${key}|${date}`);
      setVersion((v) => v + 1);
    },
    [key],
  );

  useEffect(() => {
    // Tudo que o efeito usa vem de strings (key/daysKey): dependências estáveis.
    const [proPart, servicePart] = key.split('|');
    const pros = proPart.split(',').filter(Boolean);
    const services = servicePart.split(',').filter(Boolean);
    if (pros.length === 0 || services.length === 0) {
      setByDay({});
      return;
    }
    let alive = true;
    const dayList = daysKey.split(',').filter(Boolean);
    const initial: Record<string, DaySlots> = {};
    for (const d of dayList) {
      const hit = cache.current.get(`${key}|${d}`);
      initial[d] = hit
        ? { status: 'ready', slots: hit }
        : { status: 'loading' };
    }
    setByDay(initial);

    const pending = dayList.filter((d) => !cache.current.has(`${key}|${d}`));
    let cursor = 0;
    const worker = async () => {
      while (alive && cursor < pending.length) {
        const date = pending[cursor++];
        try {
          const lists = await Promise.all(
            pros.map(async (proId) => ({
              proId,
              slots: await gateway.slots(slug, {
                professionalId: proId,
                date,
                serviceIds: services,
              }),
            })),
          );
          const merged = mergeSlots(lists);
          cache.current.set(`${key}|${date}`, merged);
          if (alive)
            setByDay((prev) => ({
              ...prev,
              [date]: { status: 'ready', slots: merged },
            }));
        } catch {
          if (alive)
            setByDay((prev) => ({ ...prev, [date]: { status: 'error' } }));
        }
      }
    };
    void Promise.all(Array.from({ length: CONCURRENCY }, worker));
    return () => {
      alive = false;
    };
  }, [slug, key, daysKey, version]);

  return { byDay, invalidate };
}
