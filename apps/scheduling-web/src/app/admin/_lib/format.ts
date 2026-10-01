/** Formatação de moeda, hora e data usada em todo o portal administrativo. */

export const WEEKDAYS_LONG = [
  'domingo',
  'segunda-feira',
  'terça-feira',
  'quarta-feira',
  'quinta-feira',
  'sexta-feira',
  'sábado',
];

export const WEEKDAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const MONTHS_LONG = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

export function brl(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function brl0(value: number): string {
  return 'R$ ' + Math.round(value).toLocaleString('pt-BR');
}

/** Formata minutos desde 00:00 como HH:MM. */
export function hm(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
}

/** Início do dia de hoje (00:00 no fuso local). */
export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Data correspondente a um deslocamento em dias a partir de hoje. */
export function dateForOffset(
  offset: number,
  base: Date = startOfToday(),
): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + offset);
  return d;
}

export function ddmm(offset: number, base?: Date): string {
  const d = dateForOffset(offset, base);
  return (
    String(d.getDate()).padStart(2, '0') +
    '/' +
    String(d.getMonth() + 1).padStart(2, '0')
  );
}

/** "Quarta-feira, 23 de setembro" */
export function longDayLabel(offset: number, base?: Date): string {
  const d = dateForOffset(offset, base);
  const wd = WEEKDAYS_LONG[d.getDay()];
  return (
    wd.charAt(0).toUpperCase() +
    wd.slice(1) +
    ', ' +
    d.getDate() +
    ' de ' +
    MONTHS_LONG[d.getMonth()]
  );
}

/** "Qua, 23 set" */
export function shortDayLabel(offset: number, base?: Date): string {
  const d = dateForOffset(offset, base);
  return (
    WEEKDAYS_SHORT[d.getDay()] +
    ', ' +
    d.getDate() +
    ' ' +
    MONTHS_LONG[d.getMonth()].slice(0, 3)
  );
}

/** Minutos desde 00:00 no momento atual. */
export function nowMinutes(date: Date = new Date()): number {
  return date.getHours() * 60 + date.getMinutes();
}

/** Duas primeiras iniciais de um nome, em maiúsculas. */
export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function greetingFor(
  hour: number,
): 'Bom dia' | 'Boa tarde' | 'Boa noite' {
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

export function firstName(name: string): string {
  return name.split(' ')[0] ?? name;
}
