import { useState, type ReactNode } from 'react';
import type { CatalogService, Professional } from '../booking';
import {
  brl,
  longDate,
  minutes,
  minutesRange,
  priceRange,
  timeLabel,
} from '../format';
import type { Slot } from './useDaySlots';
import styles from './Booking.module.css';

type Props = {
  catalog: CatalogService[];
  selected: string[];
  pro?: Professional;
  anyPro: boolean;
  slot: Slot | null;
  timeZone: string;
  priceLabel: number | [number, number] | null;
  durationLabel: number | [number, number] | null;
  action: ReactNode;
};

/**
 * A "comanda": acompanha o cliente em todos os passos. No desktop fica
 * fixa ao lado; no celular vira a barra de baixo (total + botão), com os
 * detalhes abrindo por cima quando tocados.
 */
export function Summary({
  catalog,
  selected,
  pro,
  anyPro,
  slot,
  timeZone,
  priceLabel,
  durationLabel,
  action,
}: Props) {
  const [open, setOpen] = useState(false);
  const items = selected
    .map((id) => catalog.find((c) => c.id === id))
    .filter(Boolean) as CatalogService[];
  const price =
    priceLabel === null
      ? null
      : typeof priceLabel === 'number'
        ? brl(priceLabel)
        : priceRange(priceLabel[0], priceLabel[1]);
  const duration =
    durationLabel === null
      ? null
      : typeof durationLabel === 'number'
        ? minutes(durationLabel)
        : minutesRange(durationLabel[0], durationLabel[1]);
  const date = slot
    ? new Intl.DateTimeFormat('en-CA', { timeZone }).format(
        new Date(slot.startAt),
      )
    : null;

  return (
    <aside
      className={styles.summary}
      data-open={open || undefined}
      aria-label="Resumo do agendamento"
    >
      <div className={styles.ticket} id="resumo-detalhes">
        <p className={styles.ticketHead}>Comanda</p>
        <dl className={styles.ticketList}>
          <div>
            <dt>Serviços</dt>
            <dd>
              {items.length ? (
                items.map((i) => <span key={i.id}>{i.name}</span>)
              ) : (
                <span className={styles.muted}>—</span>
              )}
            </dd>
          </div>
          <div>
            <dt>Profissional</dt>
            <dd>
              {pro ? (
                pro.name
              ) : anyPro ? (
                'Primeiro disponível'
              ) : (
                <span className={styles.muted}>—</span>
              )}
            </dd>
          </div>
          <div>
            <dt>Quando</dt>
            <dd>
              {slot && date ? (
                <>
                  <span className={styles.ticketDate}>{longDate(date)}</span>
                  <span className={styles.ticketTime}>
                    {timeLabel(slot.startAt, timeZone)}
                  </span>
                </>
              ) : (
                <span className={styles.muted}>—</span>
              )}
            </dd>
          </div>
        </dl>
        <div className={styles.ticketTear} aria-hidden />
        <div className={styles.ticketTotal}>
          <span>Total{duration ? ` · ${duration}` : ''}</span>
          <strong>{price ?? '—'}</strong>
        </div>
        <p className={styles.ticketNote}>Pagamento na barbearia.</p>
      </div>

      <div className={styles.bar}>
        <button
          type="button"
          className={styles.barTotal}
          aria-expanded={open}
          aria-controls="resumo-detalhes"
          onClick={() => setOpen((o) => !o)}
        >
          <span>
            {items.length
              ? `${items.length} ${items.length === 1 ? 'serviço' : 'serviços'}`
              : 'Nada escolhido'}
          </span>
          <strong>{price ?? 'R$ —'}</strong>
        </button>
        <div className={styles.barAction}>{action}</div>
      </div>
    </aside>
  );
}
