import styles from './Avatar.module.css';

export function Avatar({
  initials,
  size = 36,
}: {
  initials: string;
  size?: number;
}) {
  return (
    <span
      className={styles.avatar}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
    >
      {initials}
    </span>
  );
}
