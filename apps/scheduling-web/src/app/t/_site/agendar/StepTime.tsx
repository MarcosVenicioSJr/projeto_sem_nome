import { useEffect, useRef } from 'react';
import { DAY_PART_LABEL, groupByDayPart, type Professional } from '../booking';
import {
  dayOfMonth,
  firstName,
  longDate,
  monthShort,
  timeLabel,
  weekdayShort,
} from '../format';
import { Button } from '../components/Button';
import type { DaySlots, Slot } from './useDaySlots';
import styles from './Booking.module.css';

type Props = {
  days: string[];
  byDay: Record<string, DaySlots>;
  date: string | null;
  onDate: (d: string) => void;
  slot: Slot | null;
  onSlot: (s: Slot) => void;
  timeZone: string;
  pros: Professional[];
  showPro: boolean;
  onRetryDay: (d: string) => void;
};

/** Quantos pontos acender (0–4): a disponibilidade do dia como um degradê. */
function density(n: number): number {
  if (n === 0) return 0;
  if (n <= 3) return 1;
  if (n <= 7) return 2;
  if (n <= 12) return 3;
  return 4;
}

export function StepTime({
  days,
  byDay,
  date,
  onDate,
  slot,
  onSlot,
  timeZone,
  pros,
  showPro,
  onRetryDay,
}: Props) {
  const strip = useRef<HTMLDivElement>(null);
  const current = date ? byDay[date] : undefined;

  // Mantém o dia escolhido visível na faixa rolável.
  useEffect(() => {
    if (!date) return;
    strip.current
      ?.querySelector<HTMLElement>(`[data-date="${date}"]`)
      ?.scrollIntoView({
        block: 'nearest',
        inline: 'center',
        behavior: 'smooth',
      });
  }, [date]);

  const nextOpenDay = date
    ? days.slice(days.indexOf(date) + 1).find((d) => {
        const s = byDay[d];
        return s?.status === 'ready' && s.slots.length > 0;
      })
    : undefined;

  return (
    <div className={styles.timeStep}>
      <div
        className={styles.dayStrip}
        ref={strip}
        role="radiogroup"
        aria-label="Dia"
      >
        {days.map((d) => {
          const s = byDay[d];
          const count = s?.status === 'ready' ? s.slots.length : null;
          const full = count === 0;
          const on = d === date;
          return (
            <button
              key={d}
              type="button"
              role="radio"
              aria-checked={on}
              data-date={d}
              className={styles.day}
              data-full={full || undefined}
              onClick={() => onDate(d)}
              aria-label={`${longDate(d)}${count === null ? '' : full ? ', sem horários' : `, ${count} horários`}`}
            >
              <span className={styles.dayWeek}>{weekdayShort(d)}</span>
              <span className={styles.dayNum}>{dayOfMonth(d)}</span>
              <span className={styles.dayMonth}>{monthShort(d)}</span>
              <span
                className={styles.dayDots}
                data-loading={count === null || undefined}
              >
                {[1, 2, 3, 4].map((i) => (
                  <i
                    key={i}
                    data-on={
                      count !== null && i <= density(count) ? '' : undefined
                    }
                  />
                ))}
              </span>
            </button>
          );
        })}
      </div>

      {date ? <h2 className={styles.dayTitle}>{longDate(date)}</h2> : null}

      {!current || current.status === 'loading' ? (
        <div
          className={styles.slotSkeleton}
          aria-busy="true"
          aria-label="Buscando horários"
        >
          {Array.from({ length: 8 }, (_, i) => (
            <span key={i} />
          ))}
        </div>
      ) : current.status === 'error' ? (
        <div className={styles.emptyState} role="alert">
          <p className={styles.emptyTitle}>
            Não carregamos os horários desse dia.
          </p>
          <Button variant="ghost" onClick={() => date && onRetryDay(date)}>
            Tentar de novo
          </Button>
        </div>
      ) : current.slots.length === 0 ? (
        <div className={`${styles.emptyState} ${styles.closedDay}`}>
          <p className={styles.emptyTitle}>
            Agenda cheia ou fechado nesse dia.
          </p>
          {nextOpenDay ? (
            <Button variant="ghost" arrow onClick={() => onDate(nextOpenDay)}>
              Ver {weekdayShort(nextOpenDay)}, {dayOfMonth(nextOpenDay)}
            </Button>
          ) : (
            <p>Tente outro dia na faixa acima.</p>
          )}
        </div>
      ) : (
        groupByDayPart(
          current.slots.map((s) => s.startAt),
          timeZone,
        ).map((g) => (
          <fieldset key={g.part} className={styles.slotGroup}>
            <legend className={styles.slotLegend}>
              {DAY_PART_LABEL[g.part]} <span>{g.slots.length}</span>
            </legend>
            <div className={styles.slotGrid}>
              {g.slots.map((startAt) => {
                const s = current.slots.find(
                  (x) => x.startAt === startAt,
                ) as Slot;
                const on = slot?.startAt === startAt;
                const pro = showPro
                  ? pros.find((p) => p.id === s.proId)
                  : undefined;
                return (
                  <button
                    key={startAt}
                    type="button"
                    className={styles.slot}
                    aria-pressed={on}
                    onClick={() => onSlot(s)}
                  >
                    {timeLabel(startAt, timeZone)}
                    {pro ? <small>{firstName(pro.name)}</small> : null}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))
      )}
    </div>
  );
}
