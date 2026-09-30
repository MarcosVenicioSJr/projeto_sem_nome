'use client';

import { useEffect, useRef, useState } from 'react';
import { buildIcs, type Professional } from '../booking';
import { brl, firstName, longDate, timeLabel } from '../format';
import type { ShopProfile } from '../content';
import type { BookingResult } from '../gateway';
import { Razor } from '../components/Razor';
import { CutTitle } from '../components/CutTitle';
import { Button } from '../components/Button';
import { IconCalendarPlus, IconCheck, IconCopy } from '../components/icons';
import styles from './Booking.module.css';

type Props = {
  profile: ShopProfile;
  shopName: string;
  clientName: string;
  pro: Professional;
  services: string[];
  price: number;
  result: BookingResult;
};

export function Done({
  profile,
  shopName,
  clientName,
  pro,
  services,
  price,
  result,
}: Props) {
  const { timeZone, slug } = profile;
  const date = new Intl.DateTimeFormat('en-CA', { timeZone }).format(
    new Date(result.startAt),
  );
  const [copied, setCopied] = useState(false);
  const [cancelUrl, setCancelUrl] = useState(
    `/t/${slug}/cancelar/${result.cancelToken}`,
  );
  const heading = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCancelUrl(
      `${window.location.origin}/t/${slug}/cancelar/${result.cancelToken}`,
    );
    heading.current?.focus();
  }, [slug, result.cancelToken]);

  function addToCalendar() {
    const ics = buildIcs({
      uid: `${result.id}@barberadmin`,
      title: `${services.join(' + ')} · ${shopName}`,
      description: `Com ${pro.name}. Para cancelar (até 2h antes): ${cancelUrl}`,
      location: profile.contact.address,
      startAt: result.startAt,
      endAt: result.endAt,
    });
    const url = URL.createObjectURL(
      new Blob([ics], { type: 'text/calendar;charset=utf-8' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = 'meu-horario.ics';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function copyCancel() {
    try {
      await navigator.clipboard.writeText(cancelUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <main className={styles.done}>
      <div className={styles.doneRazor} aria-hidden>
        <Razor open="auto" delayMs={150} />
      </div>

      <div ref={heading} tabIndex={-1} className={styles.doneHead}>
        <CutTitle
          as="h1"
          label={`Tá marcado, ${firstName(clientName)}!`}
          eager
          delayMs={900}
          className={styles.doneTitle}
        >
          Tá marcado,
          <br />
          {firstName(clientName)}!
        </CutTitle>
      </div>

      <section className={styles.doneTicket} aria-label="Seu horário">
        <p className={styles.doneWhen}>
          <span className={styles.doneTime}>
            {timeLabel(result.startAt, timeZone)}
          </span>
          <span className={styles.doneDate}>{longDate(date)}</span>
        </p>
        <div className={styles.ticketTear} aria-hidden />
        <dl className={styles.ticketList}>
          <div>
            <dt>Serviços</dt>
            <dd>
              {services.map((s) => (
                <span key={s}>{s}</span>
              ))}
            </dd>
          </div>
          <div>
            <dt>Com</dt>
            <dd>{pro.name}</dd>
          </div>
          <div>
            <dt>Onde</dt>
            <dd>{profile.contact.address ?? shopName}</dd>
          </div>
          <div>
            <dt>Total</dt>
            <dd>{brl(price)} · pagamento na barbearia</dd>
          </div>
        </dl>
      </section>

      <div className={styles.doneActions}>
        <Button onClick={addToCalendar} size="lg">
          <IconCalendarPlus /> Adicionar à agenda
        </Button>
        <Button href={`/t/${slug}`} variant="quiet">
          Voltar ao site
        </Button>
      </div>

      <section className={styles.cancelBox} aria-labelledby="cancelar-titulo">
        <h2 id="cancelar-titulo">Imprevisto?</h2>
        <p>
          Guarde este link. Com ele você cancela sozinho até 2 horas antes do
          horário.
        </p>
        <div className={styles.cancelRow}>
          <code>{cancelUrl}</code>
          <button
            type="button"
            onClick={copyCancel}
            className={styles.copyBtn}
            aria-live="polite"
          >
            {copied ? <IconCheck /> : <IconCopy />}
            {copied ? 'Copiado' : 'Copiar'}
          </button>
        </div>
      </section>
    </main>
  );
}
