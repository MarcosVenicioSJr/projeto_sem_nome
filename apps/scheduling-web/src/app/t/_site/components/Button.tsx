import Link from 'next/link';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './Button.module.css';

type Common = {
  children: ReactNode;
  variant?: 'primary' | 'ghost' | 'quiet';
  size?: 'md' | 'lg';
  /** Seta "→" que avança no hover: indica que leva a outro lugar. */
  arrow?: boolean;
  block?: boolean;
  className?: string;
};

type AsLink = Common & { href: string; onClick?: () => void };
type AsButton = Common &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined;
    loading?: boolean;
  };

function classes(
  { variant = 'primary', size = 'md', block, className }: Common,
  loading?: boolean,
) {
  return [
    styles.btn,
    styles[variant],
    styles[size],
    block ? styles.block : '',
    loading ? styles.loading : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');
}

function Inner({ children, arrow }: { children: ReactNode; arrow?: boolean }) {
  return (
    <>
      <span className={styles.label}>{children}</span>
      {arrow ? (
        <svg className={styles.arrow} viewBox="0 0 24 24" aria-hidden>
          <path
            d="M4 12h15M13 6l6 6-6 6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="square"
          />
        </svg>
      ) : null}
    </>
  );
}

export function Button(props: AsLink | AsButton) {
  if (props.href !== undefined) {
    const { href, onClick, children, arrow } = props;
    return (
      <Link href={href} onClick={onClick} className={classes(props)}>
        <Inner arrow={arrow}>{children}</Inner>
      </Link>
    );
  }
  const {
    children,
    arrow,
    variant,
    size,
    block,
    className,
    loading,
    disabled,
    type = 'button',
    ...rest
  } = props;
  return (
    <button
      {...rest}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={classes(
        { children, variant, size, block, className },
        loading,
      )}
    >
      {loading ? <span className={styles.spinner} aria-hidden /> : null}
      <Inner arrow={arrow && !loading}>{children}</Inner>
    </button>
  );
}
