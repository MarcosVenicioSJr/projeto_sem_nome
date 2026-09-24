'use client';

import { useEffect, type ReactNode } from 'react';
import { Icon } from '../_lib/icons';
import styles from './Drawer.module.css';

export function Drawer({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <button type="button" className={styles.close} onClick={onClose} aria-label="Fechar">
          <Icon name="close" size={20} />
        </button>
        {children}
      </div>
    </div>
  );
}
