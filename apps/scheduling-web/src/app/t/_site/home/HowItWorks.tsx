'use client';

import { CutTitle } from '../components/CutTitle';
import { Eyebrow } from '../components/Bits';
import { useInView } from '../hooks';
import styles from './HowItWorks.module.css';

const STEPS = [
  {
    title: 'Escolha o serviço',
    text: 'Corte, barba, sobrancelha — junte quantos quiser. O valor e o tempo total aparecem na hora.',
  },
  {
    title: 'Barbeiro, dia e hora',
    text: 'Só aparecem horários livres de verdade, já descontando quem está na cadeira.',
  },
  {
    title: 'Nome e WhatsApp',
    text: 'Sem cadastro e sem senha. Você recebe um link para cancelar se o dia apertar.',
  },
];

export function HowItWorks() {
  const [ref, inView] = useInView<HTMLOListElement>({ threshold: 0.3 });

  return (
    <section
      id="como-funciona"
      className={styles.section}
      aria-labelledby="como-titulo"
    >
      <div className={styles.head}>
        <Eyebrow n={3}>Como funciona</Eyebrow>
        <div id="como-titulo">
          <CutTitle label="Três passos, um minuto" className={styles.title}>
            Três passos,
            <br />
            um minuto
          </CutTitle>
        </div>
      </div>

      <ol ref={ref} className={styles.steps} data-in={inView || undefined}>
        {STEPS.map((s, i) => (
          <li
            key={s.title}
            className={styles.step}
            style={{ ['--i' as string]: i }}
          >
            <span className={styles.num} aria-hidden>
              {i + 1}
            </span>
            <h3 className={styles.stepTitle}>{s.title}</h3>
            <p className={styles.stepText}>{s.text}</p>
          </li>
        ))}
      </ol>

      <p className={styles.rules}>
        Agende com pelo menos <strong>1 hora</strong> de antecedência ·
        Cancelamento online até <strong>2 horas</strong> antes
      </p>
    </section>
  );
}
