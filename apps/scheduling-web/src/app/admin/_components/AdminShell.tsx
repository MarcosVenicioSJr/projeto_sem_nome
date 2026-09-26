'use client';

import { useState, type ReactNode } from 'react';
import { useViewport } from '../_lib/viewport';
import { PageHeaderProvider } from '../_lib/page-header';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { MoreSheet } from './MoreSheet';
import { Toast } from './Toast';
import styles from './AdminShell.module.css';

export function AdminShell({ children }: { children: ReactNode }) {
  const { isMobile, isDesktop } = useViewport();
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <PageHeaderProvider>
      <div className={styles.shell}>
        {!isMobile ? <Sidebar full={isDesktop} /> : null}
        <div className={styles.content}>
          <Header isMobile={isMobile} />
          <main
            className={[styles.main, isMobile ? styles.mainMobile : ''].join(
              ' ',
            )}
          >
            {children}
          </main>
        </div>
        {isMobile ? (
          <BottomNav onMore={() => setMoreOpen(true)} moreOpen={moreOpen} />
        ) : null}
        {isMobile ? (
          <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
        ) : null}
        <Toast />
      </div>
    </PageHeaderProvider>
  );
}
