import type { HTMLAttributes, ReactNode } from 'react';
import styles from './Card.module.css';

export function Card({
  children,
  className,
  interactive,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  interactive?: boolean;
}) {
  const cls = [styles.card, interactive ? styles.interactive : '', className]
    .filter(Boolean)
    .join(' ');
  return (
    <div className={cls} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h3 className={[styles.title, className].filter(Boolean).join(' ')}>
      {children}
    </h3>
  );
}
