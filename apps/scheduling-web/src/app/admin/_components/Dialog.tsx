'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import styles from './Dialog.module.css';

export function Dialog({
  open,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 520,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  maxWidth?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // `onClose` costuma ser uma arrow nova a cada render do pai; guardá-la numa
  // ref evita refazer o efeito (e roubar o foco dos campos) a cada tecla.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', onKey);
    ref.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        ref={ref}
        className={styles.dialog}
        style={{ maxWidth }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>{title}</h2>
            {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
