'use client';

import { useId } from 'react';
import { usePrefersReducedMotion } from '../hooks';
import styles from './Razor.module.css';

type Props = {
  /**
   * Fechada = só o cabo aparece; aberta = lâmina no ângulo da logo;
   * `auto` abre sozinha ao carregar, via CSS (não depende de JS).
   */
  open: boolean | 'auto';
  /** Atraso da abertura automática, em ms. */
  delayMs?: number;
  className?: string;
  /** Brilho que atravessa a folha de ouro de tempos em tempos. */
  shine?: boolean;
  title?: string;
};

/**
 * A navalha da logo da Romario Designer, redesenhada em vetor para poder
 * abrir. Cabo e lâmina giram em torno do mesmo rebite (a origem 0,0 dos
 * grupos internos), como uma navalha de verdade.
 */
export function Razor({
  open,
  delayMs = 300,
  className,
  shine = true,
  title,
}: Props) {
  const uid = useId().replace(/:/g, '');
  const reduced = usePrefersReducedMotion();
  const foil = `foil-${uid}`;
  const grain = `grain-${uid}`;
  const sheen = `sheen-${uid}`;

  return (
    <svg
      viewBox="0 0 300 360"
      className={`${styles.razor} ${open === 'auto' ? styles.auto : open ? styles.open : ''} ${className ?? ''}`}
      style={{ ['--razor-delay' as string]: `${delayMs}ms` }}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <defs>
        <linearGradient id={foil} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f1c838" />
          <stop offset="0.35" stopColor="#d8a019" />
          <stop offset="0.7" stopColor="#cd880f" />
          <stop offset="1" stopColor="#b66e08" />
        </linearGradient>
        <linearGradient
          id={sheen}
          x1="0"
          y1="0"
          x2="1"
          y2="0"
          gradientUnits="objectBoundingBox"
        >
          <stop offset="0" stopColor="#fff6d6" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff6d6" stopOpacity="0.75" />
          <stop offset="1" stopColor="#fff6d6" stopOpacity="0" />
          {shine && !reduced ? (
            <animateTransform
              attributeName="gradientTransform"
              type="translate"
              values="-1.2 0; 1.2 0; 1.2 0"
              keyTimes="0; 0.25; 1"
              dur="6s"
              begin="1.6s"
              repeatCount="indefinite"
            />
          ) : null}
        </linearGradient>
        {/* Textura de folha de ouro: ruído fino que só existe dentro da forma. */}
        <filter id={grain} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="1.1"
            numOctaves="2"
            seed="4"
            result="noise"
          />
          <feColorMatrix
            in="noise"
            type="matrix"
            values="0 0 0 0 0.45  0 0 0 0 0.26  0 0 0 0 0.02  0 0 0 1.6 -0.72"
            result="specks"
          />
          <feComposite
            in="specks"
            in2="SourceGraphic"
            operator="in"
            result="grainIn"
          />
          <feMerge>
            <feMergeNode in="SourceGraphic" />
            <feMergeNode in="grainIn" />
          </feMerge>
        </filter>
      </defs>

      <g transform="translate(150 78)" filter={`url(#${grain})`}>
        <g className={styles.blade}>
          <path
            fill={`url(#${foil})`}
            d="M-5 4 L-9 -40 C-11 -56 -6 -66 4 -70 C8 -62 6 -54 5 -44 L6 4 Z
               M-5 2 L6 2 L9 36 L40 44 L40 214 C40 226 34 232 24 232 L8 232 C0 232 -3 226 -3 216 Z"
          />
          <path
            fill={`url(#${sheen})`}
            d="M-5 2 L6 2 L9 36 L40 44 L40 214 C40 226 34 232 24 232 L8 232 C0 232 -3 226 -3 216 Z"
          />
          {/* marca de fábrica perto da ponta, como na logo */}
          <path
            d="M30 196 L27 222"
            stroke="#7a4604"
            strokeWidth="1.4"
            strokeLinecap="round"
            opacity="0.7"
          />
        </g>
        <g className={styles.handle}>
          <path
            fill={`url(#${foil})`}
            fillRule="evenodd"
            d="M-10 -6 C-4 -14 8 -14 12 -4 L19 196 C20 222 8 234 -2 234 C-14 234 -20 222 -18 200 Z
               M5.5 214 A5.5 5.5 0 1 0 -5.5 214 A5.5 5.5 0 1 0 5.5 214 Z"
          />
          <path
            fill={`url(#${sheen})`}
            d="M-10 -6 C-4 -14 8 -14 12 -4 L19 196 C20 222 8 234 -2 234 C-14 234 -20 222 -18 200 Z"
          />
          {/* rebite */}
          <circle r="4.2" fill="#0a0907" />
          <circle r="2" fill="#7a4604" />
        </g>
      </g>
    </svg>
  );
}
