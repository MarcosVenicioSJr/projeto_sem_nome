'use client';

import Image, { type StaticImageData } from 'next/image';
import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { IconZoom } from '../components/icons';
import styles from './Loupe.module.css';

const ZOOM = 2.4;
/** Onde a lente abre ao tocar no botão: em cima do degradê, atrás da orelha. */
const DEFAULT_SPOT = { x: 0.68, y: 0.5 };
const KEY_STEP = 0.04;

/**
 * Lupa de barbeiro: mostra a transição do degradê em detalhe. No mouse,
 * a lente segue o cursor; no toque e no teclado, abre pelo botão e se
 * move arrastando ou com as setas.
 */
export function Loupe({ src, alt }: { src: StaticImageData; alt: string }) {
  const frame = useRef<HTMLDivElement>(null);
  const [spot, setSpot] = useState(DEFAULT_SPOT);
  const [hovering, setHovering] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [frameW, setFrameW] = useState(0);
  const active = hovering || pinned;

  const moveTo = (clientX: number, clientY: number) => {
    const r = frame.current?.getBoundingClientRect();
    if (!r) return;
    setFrameW(r.width);
    setSpot({
      x: Math.min(1, Math.max(0, (clientX - r.left) / r.width)),
      y: Math.min(1, Math.max(0, (clientY - r.top) / r.height)),
    });
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse') {
      setHovering(true);
      moveTo(e.clientX, e.clientY);
    } else if (pinned) {
      moveTo(e.clientX, e.clientY);
    }
  };

  const onKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (!pinned) return;
    const d = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    }[e.key];
    if (!d) return;
    e.preventDefault();
    setSpot((s) => ({
      x: Math.min(1, Math.max(0, s.x + d[0] * KEY_STEP)),
      y: Math.min(1, Math.max(0, s.y + d[1] * KEY_STEP)),
    }));
  };

  return (
    <div className={styles.wrap}>
      <div
        ref={frame}
        className={`${styles.frame} ${pinned ? styles.pinned : ''}`}
        onPointerMove={onPointerMove}
        onPointerDown={(e) => pinned && moveTo(e.clientX, e.clientY)}
        onPointerLeave={(e) => e.pointerType === 'mouse' && setHovering(false)}
      >
        <Image
          src={src}
          alt={alt}
          className={styles.photo}
          sizes="(min-width: 900px) 40vw, 100vw"
          placeholder="blur"
          draggable={false}
        />
        <div
          aria-hidden
          className={`${styles.lens} ${active ? styles.lensOn : ''}`}
          style={{
            left: `${spot.x * 100}%`,
            top: `${spot.y * 100}%`,
            backgroundImage: `url(${src.src})`,
            backgroundSize: frameW
              ? `${frameW * ZOOM}px auto`
              : `${ZOOM * 250}% auto`,
            backgroundPosition: `${spot.x * 100}% ${spot.y * 100}%`,
          }}
        />
      </div>
      <button
        type="button"
        className={styles.toggle}
        aria-pressed={pinned}
        onClick={() => {
          setFrameW(frame.current?.getBoundingClientRect().width ?? 0);
          setPinned((p) => !p);
        }}
        onKeyDown={onKey}
      >
        <IconZoom />
        {pinned ? 'Fechar lupa' : 'Ver o degradê de perto'}
        {pinned ? (
          <span className={styles.keysHint}>setas movem a lente</span>
        ) : null}
      </button>
    </div>
  );
}
