'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useSession } from './_lib/session';

/** A raiz não tem conteúdo próprio: leva ao painel ou ao login. */
export default function Index() {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === 'authenticated') router.replace('/admin/dashboard');
    if (status === 'anonymous') router.replace('/login');
  }, [status, router]);

  return null;
}
