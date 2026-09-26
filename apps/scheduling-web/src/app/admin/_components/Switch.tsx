import styles from './Switch.module.css';

export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={[styles.track, checked ? styles.on : ''].join(' ')}
    >
      <span className={styles.knob} />
    </button>
  );
}
