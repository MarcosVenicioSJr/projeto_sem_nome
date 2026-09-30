'use client';

import { useEffect, useState } from 'react';
import { Razor } from '../components/Razor';
import { Button } from '../components/Button';
import styles from './Header.module.css';

export function Header({
  name,
  bookHref,
  hasWorks,
}: {
  name: string;
  bookHref: string;
  hasWorks: boolean;
}) {
  // Transparente sobre o topo; ganha fundo quando o conteúdo passa por baixo.
  const [solid, setSolid] = useState(false);
  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const short =
    name.replace(/\s+barbearia$/i, '').split(/\s+/)[0] || 'Barbearia';

  return (
    <header className={`${styles.header} ${solid ? styles.solid : ''}`}>
      <a
        href="#topo"
        className={styles.brand}
        aria-label={`${name || 'Barbearia'} — voltar ao topo`}
      >
        <Razor open className={styles.mark} shine={false} />
        <span className={styles.brandName}>{short}</span>
      </a>
      <nav aria-label="Seções" className={styles.nav}>
        {hasWorks ? <a href="#trabalhos">Trabalhos</a> : null}
        <a href="#servicos">Serviços</a>
        <a href="#como-funciona">Como funciona</a>
      </nav>
      <div className={styles.cta}>
        <Button href={bookHref} arrow>
          Agendar
        </Button>
      </div>
    </header>
  );
}
