import type { FormEvent } from 'react';
import { maskPhone, type ClientErrors } from '../booking';
import styles from './Booking.module.css';

type Props = {
  name: string;
  phone: string;
  onName: (v: string) => void;
  onPhone: (v: string) => void;
  errors: ClientErrors;
  onSubmit: () => void;
};

/**
 * Só o essencial: a API pede nome e celular, nada de conta ou senha.
 * O botão de enviar mora no resumo (`form="dados-form"`), então o Enter do
 * teclado do celular também confirma.
 */
export function StepDetails({
  name,
  phone,
  onName,
  onPhone,
  errors,
  onSubmit,
}: Props) {
  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form className={styles.form} onSubmit={submit} noValidate id="dados-form">
      <div className={styles.field} data-invalid={errors.name ? '' : undefined}>
        <label htmlFor="cliente-nome">Seu nome</label>
        <input
          id="cliente-nome"
          name="name"
          autoComplete="name"
          autoCapitalize="words"
          value={name}
          onChange={(e) => onName(e.target.value)}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? 'cliente-nome-erro' : undefined}
          placeholder="Como te chamamos na cadeira"
          maxLength={120}
        />
        {errors.name ? (
          <p id="cliente-nome-erro" className={styles.fieldError}>
            {errors.name}
          </p>
        ) : null}
      </div>

      <div
        className={styles.field}
        data-invalid={errors.phone ? '' : undefined}
      >
        <label htmlFor="cliente-fone">Celular (WhatsApp)</label>
        <input
          id="cliente-fone"
          name="tel"
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          value={phone}
          onChange={(e) => onPhone(maskPhone(e.target.value))}
          aria-invalid={Boolean(errors.phone)}
          aria-describedby={
            errors.phone ? 'cliente-fone-erro' : 'cliente-fone-ajuda'
          }
          placeholder="(85) 99999-9999"
        />
        {errors.phone ? (
          <p id="cliente-fone-erro" className={styles.fieldError}>
            {errors.phone}
          </p>
        ) : (
          <p id="cliente-fone-ajuda" className={styles.fieldHelp}>
            Usado só para a barbearia falar com você sobre este horário.
          </p>
        )}
      </div>
    </form>
  );
}
