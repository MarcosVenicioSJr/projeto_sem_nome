'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useSession } from '../../_lib/session';

/** Só renderiza o portal com sessão válida; senão manda para o login. */
export function AuthGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === 'anonymous') router.replace('/login');
  }, [status, router]);

  if (status !== 'authenticated') {
    return (
      <div style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', background: 'var(--bg)', color: 'var(--muted)' }}>
        Carregando…
      </div>
    );
  }
  return <>{children}</>;
}
