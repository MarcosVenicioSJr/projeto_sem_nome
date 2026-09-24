'use client';

import { useAdminData } from '../_lib/data';
import styles from './Toast.module.css';

export function Toast() {
  const { toastMessage } = useAdminData();
  if (!toastMessage) return null;
  return (
    <div className={styles.wrap} role="status" aria-live="polite">
      <span className={`${styles.pill} stripes-sm`} />
      {toastMessage}
    </div>
  );
}
