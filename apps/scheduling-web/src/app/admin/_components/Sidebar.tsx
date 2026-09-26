'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useShop } from '../_lib/shop';
import { Icon } from '../_lib/icons';
import { moduleGroups } from '../_lib/nav';
import { Avatar } from './Avatar';
import styles from './Sidebar.module.css';

export function Sidebar({ full }: { full: boolean }) {
  const pathname = usePathname();
  const { shop, ownerInitials } = useShop();
  const groups = moduleGroups();

  return (
    <nav className={[styles.sidebar, full ? styles.full : styles.rail].join(' ')} aria-label="Navegação principal">
      <div className={styles.top}>
        <span className={`${styles.logoPill} stripes-sm`} aria-hidden />
        {full ? <span className={styles.shopName}>{shop.name}</span> : null}
      </div>

      <div className={styles.groups}>
        {groups.map((group) => (
          <div key={group.label} className={styles.group}>
            {full ? <span className={styles.groupLabel}>{group.label}</span> : null}
            {group.items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  title={!full ? item.label : undefined}
                  aria-current={active ? 'page' : undefined}
                  className={[styles.item, active ? styles.active : ''].join(' ')}
                >
                  <span className={styles.bar} />
                  <Icon name={item.icon} size={20} />
                  {full ? <span>{item.label}</span> : null}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        <Avatar initials={ownerInitials} size={32} />
        {full ? (
          <div className={styles.footerText}>
            <span className={styles.footerName}>{shop.owner.name}</span>
            <span className={styles.footerRole}>Dono · /t/{shop.slug}</span>
          </div>
        ) : null}
      </div>
    </nav>
  );
}
