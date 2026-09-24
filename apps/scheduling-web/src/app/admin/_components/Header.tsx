'use client';

import { usePathname } from 'next/navigation';
import { useTheme } from '../_lib/theme';
import { useShop } from '../_lib/shop';
import { Icon } from '../_lib/icons';
import { moduleForPath } from '../_lib/nav';
import { useHeaderSubtitle } from '../_lib/page-header';
import { Avatar } from './Avatar';
import styles from './Header.module.css';

export function Header({ isMobile }: { isMobile: boolean }) {
  const pathname = usePathname();
  const mod = moduleForPath(pathname);
  const overrideSubtitle = useHeaderSubtitle();
  const { theme, toggleTheme, themeLabel } = useTheme();
  const { ownerInitials } = useShop();

  return (
    <header className={styles.header}>
      <div>
        <h1 className={styles.title}>{mod?.label ?? 'Barber Admin'}</h1>
        <p className={styles.subtitle}>{overrideSubtitle ?? mod?.sub ?? ''}</p>
      </div>
      <div className={styles.actions}>
        <button type="button" className={styles.themeBtn} onClick={toggleTheme} aria-label={themeLabel}>
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
        </button>
        {isMobile ? <Avatar initials={ownerInitials} size={36} /> : null}
      </div>
    </header>
  );
}
