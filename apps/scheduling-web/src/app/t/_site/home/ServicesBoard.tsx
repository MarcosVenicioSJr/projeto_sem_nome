'use client';

import Link from 'next/link';
import { buildCatalog } from '../booking';
import { brl, minutesRange } from '../format';
import type { ShopData } from '../useShopData';
import { CutTitle } from '../components/CutTitle';
import { Eyebrow } from '../components/Bits';
import { Button } from '../components/Button';
import { IconAlert } from '../components/icons';
import styles from './ServicesBoard.module.css';

/**
 * Tabela de preços no formato do quadro de parede da barbearia: nome,
 * pontilhado, preço. Cada linha já é um atalho para agendar aquele serviço.
 */
export function ServicesBoard({
  data,
  bookHref,
}: {
  data: ShopData;
  bookHref: string;
}) {
  return (
    <section
      id="servicos"
      className={styles.section}
      aria-labelledby="servicos-titulo"
    >
      <div className={styles.head}>
        <Eyebrow n={2}>Serviços</Eyebrow>
        <div id="servicos-titulo">
          <CutTitle label="Na régua" className={styles.title}>
            Na régua
          </CutTitle>
        </div>
        <p className={styles.lead}>
          Toque num serviço para já começar o agendamento com ele escolhido.
        </p>
      </div>

      <Board data={data} bookHref={bookHref} />
    </section>
  );
}

function Board({ data, bookHref }: { data: ShopData; bookHref: string }) {
  if (data.status === 'loading') {
    return (
      <ul
        className={styles.list}
        aria-busy="true"
        aria-label="Carregando serviços"
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <li
            key={i}
            className={styles.skeleton}
            style={{ animationDelay: `${i * 90}ms` }}
          />
        ))}
      </ul>
    );
  }

  if (data.status === 'error' || data.status === 'not-found') {
    return (
      <div className={styles.state} role="status">
        <IconAlert />
        <div>
          <p className={styles.stateTitle}>
            Não deu para carregar a tabela agora.
          </p>
          <p className={styles.stateText}>
            {data.status === 'error'
              ? data.message
              : 'O agendamento online desta barbearia não está ativo.'}
          </p>
        </div>
        {data.status === 'error' ? (
          <Button variant="ghost" onClick={data.retry}>
            Tentar de novo
          </Button>
        ) : null}
      </div>
    );
  }

  const catalog = buildCatalog(data.professionals);
  if (catalog.length === 0) {
    return (
      <div className={styles.state} role="status">
        <div>
          <p className={styles.stateTitle}>
            A tabela de serviços está sendo montada.
          </p>
          <p className={styles.stateText}>
            Em breve os horários abrem por aqui.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ol className={styles.list}>
      {catalog.map((s, i) => (
        <li key={s.id}>
          <Link
            href={`${bookHref}?servico=${encodeURIComponent(s.id)}`}
            className={styles.row}
          >
            <span className={styles.index} aria-hidden>
              {String(i + 1).padStart(2, '0')}
            </span>
            <span className={styles.name}>{s.name}</span>
            <span className={styles.leader} aria-hidden />
            <span className={styles.price}>
              {s.minPrice !== s.maxPrice ? <small>a partir de </small> : null}
              {brl(s.minPrice)}
            </span>
            <span className={styles.meta}>
              {minutesRange(s.minDuration, s.maxDuration)}
            </span>
            <span className={styles.go} aria-hidden>
              Agendar →
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
