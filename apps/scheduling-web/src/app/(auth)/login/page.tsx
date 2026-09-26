'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '../../admin/_components/Button';
import { Field, Input } from '../../admin/_components/Field';
import { ApiError } from '../../_lib/api';
import { useSession } from '../../_lib/session';
import styles from '../auth.module.css';

export default function LoginPage() {
  const router = useRouter();
  const { status, login } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') router.replace('/admin/dashboard');
  }, [status, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(email.trim(), password);
      router.replace('/admin/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível entrar.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div>
        <h1 className={styles.title}>Entrar</h1>
        <p className={styles.sub}>Acesse o painel da sua empresa.</p>
      </div>
      <form className={styles.form} onSubmit={handleSubmit}>
        <Field label="E-mail">
          <Input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Senha">
          <Input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}
        <Button type="submit" variant="primary" disabled={busy || !email || !password}>
          {busy ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>
      <p className={styles.footer}>
        Ainda não tem conta? <Link href="/cadastro">Cadastre sua empresa</Link>
      </p>
    </>
  );
}
