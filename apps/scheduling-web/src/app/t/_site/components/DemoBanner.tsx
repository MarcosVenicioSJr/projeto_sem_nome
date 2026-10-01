import { gateway } from '../gateway';
import styles from './Bits.module.css';

/** Aviso fixo quando o site roda com dados de demonstração. */
export function DemoBanner() {
  if (!gateway.demo) return null;
  return (
    <p className={styles.demo} role="note">
      Modo demonstração · horários fictícios, nada é reservado
    </p>
  );
}
