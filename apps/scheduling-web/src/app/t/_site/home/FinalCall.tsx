'use client';

import type { Ref } from 'react';
import type { ShopProfile } from '../content';
import { Razor } from '../components/Razor';
import { CutTitle } from '../components/CutTitle';
import { Button } from '../components/Button';
import { IconCamera, IconChat, IconClock, IconPin } from '../components/icons';
import { useInView } from '../hooks';
import styles from './FinalCall.module.css';

type Props = {
  ref?: Ref<HTMLElement>;
  profile: ShopProfile;
  name: string;
  bookHref: string;
};

export function FinalCall({ ref, profile, name, bookHref }: Props) {
  const [razorRef, razorIn] = useInView<HTMLDivElement>({ threshold: 0.5 });
  const { whatsapp, instagram, address, mapsUrl, hours } = profile.contact;
  const hasContact = Boolean(whatsapp || instagram || address || hours);
  const year = new Date().getFullYear();

  return (
    <>
      <section
        ref={ref}
        className={styles.section}
        aria-labelledby="final-titulo"
      >
        <div ref={razorRef} className={styles.razorBox} aria-hidden>
          <Razor open={razorIn} className={styles.razor} />
        </div>
        <div className={styles.copy}>
          <div id="final-titulo">
            <CutTitle label="A cadeira é sua." className={styles.title}>
              A cadeira
              <br />é sua.
            </CutTitle>
          </div>
          <p className={styles.text}>
            Escolha o horário agora e chegue só na hora de sentar.
          </p>
          <Button href={bookHref} size="lg" arrow>
            Agendar meu horário
          </Button>
        </div>

        {hasContact ? (
          <address className={styles.contact}>
            {hours ? (
              <span>
                <IconClock /> {hours}
              </span>
            ) : null}
            {address ? (
              mapsUrl ? (
                <a href={mapsUrl} target="_blank" rel="noreferrer">
                  <IconPin /> {address}
                </a>
              ) : (
                <span>
                  <IconPin /> {address}
                </span>
              )
            ) : null}
            {whatsapp ? (
              <a
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noreferrer"
              >
                <IconChat /> WhatsApp
              </a>
            ) : null}
            {instagram ? (
              <a
                href={`https://instagram.com/${instagram}`}
                target="_blank"
                rel="noreferrer"
              >
                <IconCamera /> @{instagram}
              </a>
            ) : null}
          </address>
        ) : null}
      </section>

      <footer className={styles.footer}>
        <span className={styles.footName}>{name || 'Barbearia'}</span>
        <span>© {year}</span>
        <span className={styles.powered}>
          Agendamento online · Barber Admin
        </span>
      </footer>
    </>
  );
}
