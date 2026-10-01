import type { ReactNode } from 'react';
import styles from './Bits.module.css';

/**
 * "Degradê": malha de pontos que vai rareando, como a transição de uma
 * máquina 0 para uma 3. Separa seções sem precisar de linha dura.
 */
export function FadeRule({
  flip,
  className,
}: {
  flip?: boolean;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={`${styles.fade} ${flip ? styles.fadeFlip : ''} ${className ?? ''}`}
    />
  );
}

/**
 * Rótulo de seção no formato do pente da máquina (#0, #1, #2…): a numeração
 * que todo cliente de barbearia já conhece.
 */
export function Eyebrow({ n, children }: { n: number; children: ReactNode }) {
  return (
    <p className={styles.eyebrow}>
      <span className={styles.guard} aria-hidden>
        #{n}
      </span>
      <span>{children}</span>
    </p>
  );
}
