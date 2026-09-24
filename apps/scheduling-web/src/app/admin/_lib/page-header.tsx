'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

type PageHeaderValue = {
  subtitle: string | null;
  setSubtitle: (subtitle: string | null) => void;
};

const PageHeaderContext = createContext<PageHeaderValue | null>(null);

export function PageHeaderProvider({ children }: { children: ReactNode }) {
  const [subtitle, setSubtitle] = useState<string | null>(null);
  const value = useMemo(() => ({ subtitle, setSubtitle }), [subtitle]);
  return <PageHeaderContext.Provider value={value}>{children}</PageHeaderContext.Provider>;
}

export function useHeaderSubtitle(): string | null {
  const ctx = useContext(PageHeaderContext);
  return ctx?.subtitle ?? null;
}

/** Permite que uma página substitua o subtítulo padrão do módulo no header (ex.: a data selecionada na Agenda). */
export function useSetHeaderSubtitle(subtitle: string | null) {
  const ctx = useContext(PageHeaderContext);
  useEffect(() => {
    ctx?.setSubtitle(subtitle);
    return () => ctx?.setSubtitle(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtitle]);
}
