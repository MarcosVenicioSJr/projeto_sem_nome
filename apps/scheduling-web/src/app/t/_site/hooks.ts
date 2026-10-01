'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

/**
 * `true` quando o elemento entra na tela (uma vez só). Sem suporte a
 * IntersectionObserver, retorna `true` direto — o conteúdo nunca fica
 * escondido por falta de JS ou de API.
 */
export function useInView<T extends Element>(
  options: IntersectionObserverInit = { threshold: 0.35 },
) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  const { threshold, rootMargin } = options;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold, rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold, rootMargin]);

  return [ref, inView] as const;
}

/** Visibilidade contínua (entra e sai), para pausar animações fora da tela. */
export function useVisible<T extends Element>(
  threshold = 0.2,
  initial = false,
) {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(initial);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), {
      threshold,
    });
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, visible] as const;
}

function subscribeReducedMotion(cb: () => void) {
  if (typeof window === 'undefined' || !window.matchMedia)
    return () => undefined;
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () =>
      typeof window !== 'undefined' && window.matchMedia
        ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
        : false,
    () => false,
  );
}
