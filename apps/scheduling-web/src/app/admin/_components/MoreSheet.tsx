'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '../_lib/icons';
import { BOTTOM_NAV_IDS, MODULES } from '../_lib/nav';
import styles from './MoreSheet.module.css';

export function MoreSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  if (!open) return null;
  const items = MODULES.filter((m) => !BOTTOM_NAV_IDS.includes(m.id));

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <div className={styles.grid}>
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link key={item.id} href={item.href} onClick={onClose} className={[styles.card, active ? styles.active : ''].join(' ')}>
                <Icon name={item.icon} size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
