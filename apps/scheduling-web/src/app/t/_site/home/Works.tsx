'use client';

import type { ShopWork } from '../content';
import { CutTitle } from '../components/CutTitle';
import { Eyebrow } from '../components/Bits';
import { IconCamera } from '../components/icons';
import { AngleViewer } from './AngleViewer';
import { Loupe } from './Loupe';
import styles from './Works.module.css';

export function Works({
  works,
  instagram,
}: {
  works: ShopWork[];
  instagram?: string;
}) {
  return (
    <section
      id="trabalhos"
      className={styles.section}
      aria-labelledby="trabalhos-titulo"
    >
      <div className={styles.head}>
        <Eyebrow n={1}>Na cadeira</Eyebrow>
        <div id="trabalhos-titulo">
          <CutTitle label="Trabalhos" className={styles.title}>
            Trabalhos
          </CutTitle>
        </div>
        <p className={styles.lead}>
          Nada de foto de banco de imagem: são cortes feitos aqui, do jeito que
          o cliente saiu da cadeira.
        </p>
      </div>

      <div className={styles.grid}>
        {works.map((w) => (
          <figure
            key={w.title}
            className={`${styles.work} ${w.kind === 'angles' ? styles.wide : styles.narrow}`}
          >
            {w.kind === 'angles' ? (
              <AngleViewer angles={w.angles} title={w.title} />
            ) : (
              <Loupe src={w.src} alt={w.alt} />
            )}
            <figcaption className={styles.caption}>
              <span className={styles.captionTitle}>{w.title}</span>
              <span className={styles.captionText}>{w.description}</span>
            </figcaption>
          </figure>
        ))}
      </div>

      {instagram ? (
        <a
          className={styles.more}
          href={`https://instagram.com/${instagram}`}
          target="_blank"
          rel="noreferrer"
        >
          <IconCamera /> Mais cortes no @{instagram}
        </a>
      ) : null}
    </section>
  );
}
