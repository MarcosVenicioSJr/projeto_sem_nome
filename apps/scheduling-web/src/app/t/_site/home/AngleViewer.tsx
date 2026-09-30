'use client';

import Image from 'next/image';
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';
import type { WorkAngle } from '../content';
import { usePrefersReducedMotion, useVisible } from '../hooks';
import { IconRotate } from '../components/icons';
import styles from './AngleViewer.module.css';

/** Direção aproximada de cada foto, para o ponteiro da bússola. */
const NEEDLE = [-90, -45, 0, 90, 135, 180];
const DRAG_STEP_PX = 56;
const AUTOPLAY_MS = 2400;

/**
 * "Gire o corte": as fotos do mesmo corte em ângulos diferentes viram uma
 * cabeça que o cliente gira arrastando (ou pelos botões/setas). Mostra o
 * que importa num degradê — a transição ao redor da cabeça inteira.
 */
export function AngleViewer({
  angles,
  title,
}: {
  angles: WorkAngle[];
  title: string;
}) {
  const [index, setIndex] = useState(0);
  const [touched, setTouched] = useState(false);
  const [hover, setHover] = useState(false);
  const reduced = usePrefersReducedMotion();
  const [ref, visible] = useVisible<HTMLDivElement>(0.4);
  const drag = useRef<{ x: number; start: number } | null>(null);
  const count = angles.length;

  // Gira sozinha enquanto está na tela, até o cliente interagir.
  useEffect(() => {
    if (reduced || touched || hover || !visible) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % count), AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [reduced, touched, hover, visible, count]);

  const go = (i: number) => {
    setTouched(true);
    setIndex(((i % count) + count) % count);
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    drag.current = { x: e.clientX, start: index };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    const steps = Math.round((e.clientX - drag.current.x) / DRAG_STEP_PX);
    const next = (((drag.current.start + steps) % count) + count) % count;
    if (next !== index) go(next);
  };
  const onPointerUp = () => {
    drag.current = null;
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      go(index + 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      go(index - 1);
    }
  };

  return (
    <div
      className={styles.viewer}
      ref={ref}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div
        className={styles.stage}
        role="group"
        aria-roledescription="visualizador de ângulos"
        aria-label={`${title}: ${angles[index].label}, ${index + 1} de ${count}. Use as setas para girar.`}
        tabIndex={0}
        onKeyDown={onKey}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {angles.map((a, i) => (
          <Image
            key={a.label}
            src={a.src}
            alt={i === index ? a.alt : ''}
            aria-hidden={i !== index}
            className={`${styles.photo} ${i === index ? styles.active : ''}`}
            sizes="(min-width: 900px) 56vw, 100vw"
            placeholder="blur"
            draggable={false}
            priority={i === 0}
          />
        ))}
        <span
          className={styles.hint}
          aria-hidden
          data-hidden={touched || undefined}
        >
          <IconRotate /> Arraste para girar
        </span>
        <svg className={styles.compass} viewBox="-20 -20 40 40" aria-hidden>
          <circle r="17" />
          <path className={styles.nose} d="M-3 -17 L0 -21 L3 -17" />
          <line
            className={styles.needle}
            x1="0"
            y1="0"
            x2="0"
            y2="-13"
            style={{ transform: `rotate(${NEEDLE[index] ?? 0}deg)` }}
          />
        </svg>
      </div>

      <div className={styles.dial} role="group" aria-label="Escolher ângulo">
        {angles.map((a, i) => (
          <button
            key={a.label}
            type="button"
            className={styles.tick}
            aria-pressed={i === index}
            onClick={() => go(i)}
          >
            <span className={styles.tickBar} aria-hidden />
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}
