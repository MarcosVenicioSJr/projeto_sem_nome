'use client';

import { useEffect, useState } from 'react';

/**
 * Relógio reativo, atualizado a cada minuto — usado na saudação do
 * Dashboard, no subtítulo da Agenda e na linha "agora" da grade.
 */
export function useNow(intervalMs = 30_000): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
