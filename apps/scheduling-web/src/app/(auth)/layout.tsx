import type { ReactNode } from 'react';
import { ThemeProvider } from '../admin/_lib/theme';
import '../admin/_styles/tokens.css';
import styles from './auth.module.css';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <div className={styles.wrap}>
        <div className={styles.card}>
          <div className={styles.brand}>Barber Admin</div>
          {children}
        </div>
      </div>
    </ThemeProvider>
  );
}
