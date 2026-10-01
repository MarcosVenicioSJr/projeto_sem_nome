'use client';

import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../../_lib/api';
import type { Professional } from './booking';
import { gateway } from './gateway';

export type ShopData =
  | { status: 'loading' }
  | { status: 'not-found' }
  | { status: 'error'; message: string; retry: () => void }
  | { status: 'ready'; name: string; professionals: Professional[] };

/** Nome da barbearia (API) + profissionais com seus serviços e preços. */
export function useShopData(slug: string): ShopData {
  const [state, setState] = useState<ShopData>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    let alive = true;
    setState({ status: 'loading' });
    Promise.all([gateway.shop(slug), gateway.professionals(slug)])
      .then(([shop, professionals]) => {
        if (alive)
          setState({ status: 'ready', name: shop.name, professionals });
      })
      .catch((err: unknown) => {
        if (!alive) return;
        if (err instanceof ApiError && err.status === 404)
          setState({ status: 'not-found' });
        else
          setState({
            status: 'error',
            message:
              err instanceof ApiError
                ? err.message
                : 'Não foi possível carregar os serviços agora.',
            retry,
          });
      });
    return () => {
      alive = false;
    };
  }, [slug, attempt, retry]);

  return state;
}
