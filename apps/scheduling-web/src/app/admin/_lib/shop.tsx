'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { initials } from './format';

/**
 * Configuração do tenant (barbearia) exibida em todo o portal. Nada aqui
 * pode ser fixo no código: enquanto a API não expõe `Tenant`/`Owner`, os
 * valores padrão vêm de variáveis de ambiente — ver
 * `docs/arch/configuration.md`.
 */
export type ShopConfig = {
  name: string;
  slug: string;
  address?: string;
  phone?: string;
  cnpj?: string;
  owner: { name: string; email: string };
};

const DEFAULT_SHOP: ShopConfig = {
  name: process.env.NEXT_PUBLIC_SHOP_NAME ?? 'Minha Barbearia',
  slug: process.env.NEXT_PUBLIC_SHOP_SLUG ?? 'minha-barbearia',
  address: process.env.NEXT_PUBLIC_SHOP_ADDRESS,
  phone: process.env.NEXT_PUBLIC_SHOP_PHONE,
  cnpj: process.env.NEXT_PUBLIC_SHOP_CNPJ,
  owner: {
    name: process.env.NEXT_PUBLIC_SHOP_OWNER_NAME ?? 'Dono da barbearia',
    email: process.env.NEXT_PUBLIC_SHOP_OWNER_EMAIL ?? 'dono@example.com',
  },
};

export const PUBLIC_BOOKING_BASE_URL = process.env.NEXT_PUBLIC_PUBLIC_BOOKING_URL ?? 'https://barberadmin.app';

type ShopContextValue = {
  shop: ShopConfig;
  ownerInitials: string;
  publicBookingUrl: string;
  updateShop: (patch: Partial<Omit<ShopConfig, 'owner'>>) => void;
};

const ShopContext = createContext<ShopContextValue | null>(null);

export function ShopProvider({ children, initialShop }: { children: ReactNode; initialShop?: ShopConfig }) {
  const [shop, setShop] = useState<ShopConfig>(initialShop ?? DEFAULT_SHOP);

  const updateShop = useCallback((patch: Partial<Omit<ShopConfig, 'owner'>>) => {
    setShop((prev) => ({ ...prev, ...patch }));
  }, []);

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
