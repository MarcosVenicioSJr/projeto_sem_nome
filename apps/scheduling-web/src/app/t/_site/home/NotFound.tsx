import { Razor } from '../components/Razor';
import styles from './NotFound.module.css';

/** Link de barbearia que não existe (slug errado ou desativado). */
export function NotFound() {
  return (
    <main className={styles.wrap}>
      <Razor open={false} className={styles.razor} shine={false} />
      <h1 className={styles.title}>Barbearia não encontrada</h1>
      <p className={styles.text}>
        Confira o link com a barbearia — ele pode ter mudado ou estar digitado
        errado.
      </p>
    </main>
  );
}
