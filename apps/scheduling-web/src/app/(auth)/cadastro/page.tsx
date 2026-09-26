'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '../../admin/_components/Button';
import { Field, Input } from '../../admin/_components/Field';
import { ApiError } from '../../_lib/api';
import { useSession } from '../../_lib/session';
import styles from '../auth.module.css';

/** "Barbearia do Zé" -> "barbearia-do-ze" */
function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export default function CadastroPage() {
  const router = useRouter();
  const { status, register } = useSession();
  const [form, setForm] = useState({ company: '', slug: '', name: '', email: '', phone: '', password: '' });
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') router.replace('/admin/dashboard');
  }, [status, router]);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
      ...(key === 'company' && !slugTouched ? { slug: slugify(value) } : {}),
    }));
  }

  const valid = Object.values(form).every((v) => v.trim().length > 0) && form.phone.length === 11;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await register({
        tenant: { name: form.company.trim(), slug: form.slug },
        owner: { name: form.name.trim(), email: form.email.trim(), phone: form.phone, password: form.password },
      });
      router.replace('/admin/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível criar a conta.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div>
        <h1 className={styles.title}>Cadastre sua empresa</h1>
        <p className={styles.sub}>Você será o dono e poderá convidar sua equipe depois.</p>
      </div>
      <form className={styles.form} onSubmit={handleSubmit}>
        <span className={styles.section}>Empresa</span>
        <Field label="Nome da empresa">
          <Input required value={form.company} onChange={(e) => set('company', e.target.value)} placeholder="Ex.: Navalha de Ouro" />
        </Field>
        <Field label="Endereço da página" hint={`Seus clientes agendam em /t/${form.slug || 'sua-empresa'}`}>
          <Input
            required
            value={form.slug}
            onChange={(e) => {
              setSlugTouched(true);
              set('slug', slugify(e.target.value));
            }}
          />
        </Field>

        <span className={styles.section}>Você</span>
        <Field label="Seu nome">
          <Input required autoComplete="name" value={form.name} onChange={(e) => set('name', e.target.value)} />
        </Field>
        <div className={styles.row}>
          <Field label="E-mail">
            <Input type="email" required autoComplete="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
          </Field>
          <Field label="Telefone (com DDD)">
            <Input
              inputMode="numeric"
              required
              autoComplete="tel"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value.replace(/\D/g, '').slice(0, 11))}
              placeholder="11987654321"
            />
          </Field>
        </div>
        <Field label="Senha" hint="Mínimo de 8 caracteres, com maiúscula, minúscula e número">
          <Input
            type="password"
            required
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => set('password', e.target.value)}
          />
        </Field>

        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}
        <Button type="submit" variant="primary" disabled={busy || !valid}>
          {busy ? 'Criando…' : 'Criar conta'}
        </Button>
      </form>
      <p className={styles.footer}>
        Já tem conta? <Link href="/login">Entrar</Link>
      </p>
    </>
  );
}
