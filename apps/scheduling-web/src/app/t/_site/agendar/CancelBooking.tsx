'use client';

import { useState } from 'react';
import { ApiError } from '../../../_lib/api';
import type { ShopProfile } from '../content';
import { gateway } from '../gateway';
import { Razor } from '../components/Razor';
import { Button } from '../components/Button';
import { IconAlert } from '../components/icons';
import styles from './Cancel.module.css';

type State =
  | { kind: 'confirm' }
  | { kind: 'sending' }
  | { kind: 'done' }
  | { kind: 'error'; message: string; final: boolean };

export function CancelBooking({
  profile,
  token,
}: {
  profile: ShopProfile;
  token: string;
}) {
  const [state, setState] = useState<State>({ kind: 'confirm' });
  const site = `/t/${profile.slug}`;
  const whatsapp = profile.contact.whatsapp;

  async function cancel() {
    setState({ kind: 'sending' });
    try {
      await gateway.cancel(token);
      setState({ kind: 'done' });
    } catch (err) {
      if (err instanceof ApiError && err.status !== 0) {
        // 404/409: não adianta tentar de novo (link inválido, prazo encerrado, já cancelado).
        setState({
          kind: 'error',
          message: err.message,
          final: err.status === 404 || err.status === 409,
        });
      } else {
        setState({
          kind: 'error',
          message: 'Sem conexão com a barbearia agora. Tente de novo.',
          final: false,
        });
      }
    }
  }

  return (
    <main className={styles.wrap}>
      {/* A navalha fecha quando o horário é cancelado. */}
      <Razor
        open={state.kind !== 'done'}
        className={styles.razor}
        shine={false}
      />

      {state.kind === 'done' ? (
        <>
          <h1 className={styles.title}>Horário cancelado</h1>
          <p className={styles.text}>
            A cadeira foi liberada. Quando quiser, é só marcar de novo.
          </p>
          <Button href={`${site}/agendar`} arrow>
            Marcar outro horário
          </Button>
        </>
      ) : (
        <>
          <h1 className={styles.title}>Cancelar seu horário?</h1>
          <p className={styles.text}>
            O cancelamento online vale até 2 horas antes. Depois disso, fale
            direto com a barbearia.
          </p>

          {state.kind === 'error' ? (
            <p className={styles.error} role="alert">
              <IconAlert /> {state.message}
            </p>
          ) : null}

          <div className={styles.actions}>
            {state.kind === 'error' && state.final ? (
              whatsapp ? (
                <Button href={`https://wa.me/${whatsapp}`} arrow>
                  Falar no WhatsApp
                </Button>
              ) : null
            ) : (
              <Button onClick={cancel} loading={state.kind === 'sending'}>
                {state.kind === 'sending' ? 'Cancelando…' : 'Sim, cancelar'}
              </Button>
            )}
            <Button href={site} variant="quiet">
              Manter meu horário
            </Button>
          </div>
        </>
      )}
    </main>
  );
}
