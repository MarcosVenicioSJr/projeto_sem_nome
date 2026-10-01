import type { CatalogService } from '../booking';
import { brl, minutesRange } from '../format';
import { IconAlert, IconCheck } from '../components/icons';
import styles from './Booking.module.css';

type Props = {
  catalog: CatalogService[];
  selected: string[];
  onChange: (ids: string[]) => void;
  noProForCombo: boolean;
};

/** Seleção múltipla: combos (corte + barba) são o caso mais comum. */
export function StepServices({
  catalog,
  selected,
  onChange,
  noProForCombo,
}: Props) {
  const toggle = (id: string) =>
    onChange(
      selected.includes(id)
        ? selected.filter((x) => x !== id)
        : [...selected, id],
    );

  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.hint}>
        Escolha um ou mais — dá pra juntar corte e barba.
      </legend>
      <ul className={styles.optionList}>
        {catalog.map((s) => {
          const on = selected.includes(s.id);
          return (
            <li key={s.id}>
              <label className={styles.option} data-checked={on || undefined}>
                <input
                  type="checkbox"
                  className={styles.srInput}
                  checked={on}
                  onChange={() => toggle(s.id)}
                />
                <span className={styles.check} aria-hidden>
                  {on ? <IconCheck /> : null}
                </span>
                <span className={styles.optionMain}>
                  <span className={styles.optionName}>{s.name}</span>
                  <span className={styles.optionMeta}>
                    {minutesRange(s.minDuration, s.maxDuration)}
                  </span>
                </span>
                <span className={styles.optionPrice}>
                  {s.minPrice !== s.maxPrice ? (
                    <small>a partir de</small>
                  ) : null}
                  {brl(s.minPrice)}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
      {noProForCombo ? (
        <p className={styles.inlineWarn} role="status">
          <IconAlert /> Nenhum profissional faz todos esses serviços no mesmo
          horário. Tire um deles ou agende separado.
        </p>
      ) : null}
    </fieldset>
  );
}
