'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useSession } from '../../_lib/session';
import { initials } from './format';

/**
 * Configuração do tenant (empresa) exibida em todo o portal. Nome, endereço
 * (slug) e dono vêm da API pela sessão; os demais campos (endereço físico,
 * telefone, CNPJ) ainda não existem na API e ficam só neste navegador —
 * ver `docs/arch/configuration.md`.
 */
export type ShopConfig = {
  name: string;
  slug: string;
  address?: string;
  phone?: string;
  cnpj?: string;
  owner: { name: string; email: string };
};

export const PUBLIC_BOOKING_BASE_URL = process.env.NEXT_PUBLIC_PUBLIC_BOOKING_URL ?? 'https://barberadmin.app';

export const ROLE_LABEL = { owner: 'Dono', manager: 'Gerente', employee: 'Profissional' } as const;

type ShopContextValue = {
  shop: ShopConfig;
  ownerInitials: string;
  publicBookingUrl: string;
  updateShop: (patch: Partial<Omit<ShopConfig, 'owner'>>) => void;
};

const ShopContext = createContext<ShopContextValue | null>(null);

export function ShopProvider({ children }: { children: ReactNode }) {
  const { me, tenant } = useSession();
  const [local, setLocal] = useState<Partial<Omit<ShopConfig, 'owner'>>>({});

  const updateShop = useCallback((patch: Partial<Omit<ShopConfig, 'owner'>>) => {
    setLocal((prev) => ({ ...prev, ...patch }));
  }, []);

  const shop = useMemo<ShopConfig>(
    () => ({
      name: tenant?.name ?? '',
      slug: tenant?.slug ?? '',
      owner: { name: me?.name ?? '', email: me?.email ?? '' },
      ...local,
    }),
    [tenant, me, local],
  );

  const value = useMemo<ShopContextValue>(
    () => ({
      shop,
      ownerInitials: initials(shop.owner.name),
      publicBookingUrl: `${PUBLIC_BOOKING_BASE_URL}/t/${shop.slug}`,
      updateShop,
    }),
    [shop, updateShop],
  );

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop(): ShopContextValue {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error('useShop deve ser usado dentro de <ShopProvider>');
  return ctx;
}
