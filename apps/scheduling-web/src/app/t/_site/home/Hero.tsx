import type { Ref } from 'react';
import type { ShopProfile } from '../content';
import { Razor } from '../components/Razor';
import { CutTitle } from '../components/CutTitle';
import { Button } from '../components/Button';
import { IconCalendarCheck, IconLink, IconUserOff } from '../components/icons';
import styles from './Hero.module.css';

/** "Romario Designer Barbearia" → linhas ["Romario", "Designer"] + rótulo "Barbearia". */
function splitName(name: string): { lines: string[]; kicker: string } {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return { lines: ['Barbearia'], kicker: '' };
  const last = words[words.length - 1];
  const hasKicker = words.length > 1 && /^barbearia$/i.test(last);
  const main = hasKicker ? words.slice(0, -1) : words;
  if (main.length <= 2) return { lines: main, kicker: hasKicker ? last : '' };
  const half = Math.ceil(main.length / 2);
  return {
    lines: [main.slice(0, half).join(' '), main.slice(half).join(' ')],
    kicker: hasKicker ? last : '',
  };
}

type Props = {
  profile: ShopProfile;
  name: string;
  bookHref: string;
  ctaRef: Ref<HTMLDivElement>;
};

export function Hero({ profile, name, bookHref, ctaRef }: Props) {
  const { lines, kicker } = splitName(name);

  return (
    <section id="topo" className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.razorWrap} aria-hidden>
        <div className={styles.glow} />
        <Razor open="auto" delayMs={350} className={styles.razor} />
      </div>

      <div className={styles.copy}>
        {kicker ? (
          <p className={styles.kicker}>
            <span>{kicker}</span>
          </p>
        ) : null}

        {/* O corte acontece logo depois que a lâmina termina de abrir. */}
        <div id="hero-title">
          <CutTitle
            as="h1"
            label={name || 'Barbearia'}
            eager
            delayMs={1250}
            className={styles.title}
          >
            {lines.map((l, i) => (
              <span
                key={l}
                className={
                  i === lines.length - 1 && lines.length > 1
                    ? styles.foilLine
                    : styles.line
                }
              >
                {l}
              </span>
            ))}
          </CutTitle>
        </div>

        <p className={styles.tagline}>
          <span>{profile.tagline[0]}</span>{' '}
          <span className={styles.taglineAccent}>{profile.tagline[1]}</span>
        </p>
        <p className={styles.intro}>{profile.intro}</p>

        <div className={styles.actions} ref={ctaRef}>
          <Button href={bookHref} size="lg" arrow>
            Agendar meu horário
          </Button>
          {profile.works.length > 0 ? (
            <Button href="#trabalhos" variant="quiet">
              Ver trabalhos
            </Button>
          ) : null}
        </div>

        <ul className={styles.facts}>
          <li>
            <IconUserOff /> Sem cadastro e sem senha
          </li>
          <li>
            <IconCalendarCheck /> Só horários livres de verdade
          </li>
          <li>
            <IconLink /> Cancele pelo link, até 2h antes
          </li>
        </ul>
      </div>
    </section>
  );
}
