'use client';

import type { ElementType, ReactNode } from 'react';
import { useInView } from '../hooks';
import styles from './CutTitle.module.css';

type Props = {
  children: ReactNode;
  /** Texto para leitores de tela (as camadas visuais ficam ocultas). */
  label: string;
  as?: ElementType;
  className?: string;
  /** Corte imediato, sem esperar entrar na tela (ex.: título do topo). */
  eager?: boolean;
  delayMs?: number;
};

/**
 * Assinatura visual do site: o título é "cortado na navalha". Quando entra
 * na tela, um fio de ouro atravessa o texto na diagonal da lâmina e as duas
 * metades deslizam, ficando separadas por um vão fino — como a linha de um
 * degradê desenhado. Sem JS ou com movimento reduzido, o título aparece
 * inteiro e legível.
 */
export function CutTitle({
  children,
  label,
  as: Tag = 'h2',
  className,
  eager,
  delayMs = 0,
}: Props) {
  const [ref, inView] = useInView<HTMLElement>({ threshold: 0.6 });
  const cut = eager || inView;

  return (
    <Tag
      ref={ref}
      className={`${styles.title} ${className ?? ''}`}
      data-cut={cut ? 'done' : 'idle'}
      style={{ ['--cut-delay' as string]: `${delayMs}ms` }}
    >
      <span className={styles.sr}>{label}</span>
      <span aria-hidden className={styles.ghost}>
        {children}
      </span>
      <span aria-hidden className={styles.top}>
        {children}
      </span>
      <span aria-hidden className={styles.bottom}>
        {children}
      </span>
      <span aria-hidden className={styles.blade} />
    </Tag>
  );
}
