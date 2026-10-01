'use client';

import type { ShopProfile } from '../content';
import { useVisible } from '../hooks';
import { useShopData } from '../useShopData';
import { FadeRule } from '../components/Bits';
import { Header } from './Header';
import { Hero } from './Hero';
import { Works } from './Works';
import { ServicesBoard } from './ServicesBoard';
import { HowItWorks } from './HowItWorks';
import { FinalCall } from './FinalCall';
import { StickyBook } from './StickyBook';
import { NotFound } from './NotFound';
import styles from './SiteHome.module.css';

export function SiteHome({ profile }: { profile: ShopProfile }) {
  const data = useShopData(profile.slug);
  const name = profile.name || (data.status === 'ready' ? data.name : '');
  const bookHref = `/t/${profile.slug}/agendar`;

  // A barra fixa de "Agendar" (mobile) só aparece quando nenhum outro botão
  // de agendar está visível — nunca dois CTAs iguais na mesma tela.
  const [heroCtaRef, heroCtaVisible] = useVisible<HTMLDivElement>(0, true);
  const [finalRef, finalVisible] = useVisible<HTMLElement>(0.25);

  if (data.status === 'not-found' && !profile.name) return <NotFound />;

  return (
    <div className={styles.page}>
      <a href="#conteudo" className={styles.skip}>
        Pular para o conteúdo
      </a>
      <Header
        name={name}
        bookHref={bookHref}
        hasWorks={profile.works.length > 0}
      />
      <main id="conteudo">
        <Hero
          profile={profile}
          name={name}
          bookHref={bookHref}
          ctaRef={heroCtaRef}
        />
        {profile.works.length > 0 ? (
          <>
            <FadeRule />
            <Works
              works={profile.works}
              instagram={profile.contact.instagram}
            />
          </>
        ) : null}
        <FadeRule flip />
        <ServicesBoard data={data} bookHref={bookHref} />
        <HowItWorks />
        <FinalCall
          ref={finalRef}
          profile={profile}
          name={name}
          bookHref={bookHref}
        />
      </main>
      <StickyBook href={bookHref} show={!heroCtaVisible && !finalVisible} />
    </div>
  );
}
