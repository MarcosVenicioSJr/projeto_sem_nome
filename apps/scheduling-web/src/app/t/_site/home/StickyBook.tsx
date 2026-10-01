'use client';

import { Button } from '../components/Button';
import styles from './StickyBook.module.css';

/** Barra de agendar no celular, na zona do polegar. Some no desktop. */
export function StickyBook({ href, show }: { href: string; show: boolean }) {
  return (
    <div
      className={styles.bar}
      data-show={show || undefined}
      aria-hidden={!show}
      inert={!show}
    >
      <Button href={href} size="lg" arrow block>
        Agendar horário
      </Button>
    </div>
  );
}
