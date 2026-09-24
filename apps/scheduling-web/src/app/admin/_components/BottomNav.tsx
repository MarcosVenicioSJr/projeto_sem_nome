'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '../_lib/icons';
import { BOTTOM_NAV_IDS, MODULES, moduleForPath } from '../_lib/nav';
import styles from './BottomNav.module.css';

export function BottomNav({ onMore, moreOpen }: { onMore: () => void; moreOpen: boolean }) {
  const pathname = usePathname();
  const current = moduleForPath(pathname);
  const items = BOTTOM_NAV_IDS.map((id) => MODULES.find((m) => m.id === id)!);
  const moreActive = moreOpen || !!(current && !BOTTOM_NAV_IDS.includes(current.id));

  return (
    <nav className={styles.nav} aria-label="Navegação">
      {items.map((item) => {
        const active = current?.id === item.id;
        return (
          <Link
            key={item.id}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={[styles.item, active ? styles.active : ''].join(' ')}
          >
            <Icon name={item.icon} size={20} />
            <span>{item.short}</span>
            <span className={[styles.indicator, active ? styles.indicatorOn : ''].join(' ')} />
          </Link>
        );
      })}
      <button
        type="button"
        className={[styles.item, moreActive ? styles.active : ''].join(' ')}
        onClick={onMore}
        aria-haspopup="true"
        aria-expanded={moreOpen}
      >
        <Icon name="more" size={20} />
        <span>Mais</span>
        <span className={[styles.indicator, moreActive ? styles.indicatorOn : ''].join(' ')} />
      </button>
    </nav>
  );
}
