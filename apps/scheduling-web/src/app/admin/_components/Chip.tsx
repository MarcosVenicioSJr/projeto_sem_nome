import type { ButtonHTMLAttributes } from 'react';
import styles from './Chip.module.css';

export function Chip({
  active,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  const cls = [styles.chip, active ? styles.active : '', className]
    .filter(Boolean)
    .join(' ');
  return <button type="button" className={cls} {...props} />;
}
