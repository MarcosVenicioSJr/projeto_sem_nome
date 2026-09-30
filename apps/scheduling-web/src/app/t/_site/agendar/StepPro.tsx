import { quote, quoteRange, type Professional } from '../booking';
import { brl, minutes, priceRange } from '../format';
import { IconScissors } from '../components/icons';
import styles from './Booking.module.css';

type Props = {
  pros: Professional[];
  serviceIds: string[];
  value: string | null;
  onChange: (v: string) => void;
};

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

export function StepPro({ pros, serviceIds, value, onChange }: Props) {
  const range = quoteRange(pros, serviceIds);

  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.hint}>
        O preço pode variar um pouco de um profissional para outro.
      </legend>
      <ul className={styles.optionList}>
        <li>
          <label
            className={styles.option}
            data-checked={value === 'any' || undefined}
          >
            <input
              type="radio"
              name="pro"
              className={styles.srInput}
              checked={value === 'any'}
              onChange={() => onChange('any')}
            />
            <span
              className={`${styles.avatar} ${styles.avatarAny}`}
              aria-hidden
            >
              <IconScissors />
            </span>
            <span className={styles.optionMain}>
              <span className={styles.optionName}>Primeiro disponível</span>
              <span className={styles.optionMeta}>
                Mais horários para escolher
              </span>
            </span>
            <span className={styles.optionPrice}>
              {range ? priceRange(range.minPrice, range.maxPrice) : null}
            </span>
          </label>
        </li>
        {pros.map((p) => {
          const q = quote(p, serviceIds);
          return (
            <li key={p.id}>
              <label
                className={styles.option}
                data-checked={value === p.id || undefined}
              >
                <input
                  type="radio"
                  name="pro"
                  className={styles.srInput}
                  checked={value === p.id}
                  onChange={() => onChange(p.id)}
                />
                <span className={styles.avatar} aria-hidden>
                  {initials(p.name)}
                </span>
                <span className={styles.optionMain}>
                  <span className={styles.optionName}>{p.name}</span>
                  <span className={styles.optionMeta}>
                    {minutes(q.duration)}
                  </span>
                </span>
                <span className={styles.optionPrice}>{brl(q.price)}</span>
              </label>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}
