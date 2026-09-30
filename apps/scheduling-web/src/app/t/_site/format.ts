const brlFmt = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function brl(value: number): string {
  return brlFmt.format(value);
}

export function priceRange(min: number, max: number): string {
  return min === max ? brl(min) : `${brl(min)} – ${brl(max)}`;
}

export function minutes(total: number): string {
  if (total < 60) return `${total} min`;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return m ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`;
}

export function minutesRange(min: number, max: number): string {
  return min === max ? minutes(min) : `${minutes(min)}–${minutes(max)}`;
}

export function timeLabel(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

/** Data `YYYY-MM-DD` tratada como dia civil (meio-dia UTC para não escorregar). */
function civil(date: string): Date {
  return new Date(`${date}T12:00:00Z`);
}

export function weekdayShort(date: string): string {
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'short', timeZone: 'UTC' })
    .format(civil(date))
    .replace('.', '');
}

export function dayOfMonth(date: string): string {
  return String(civil(date).getUTCDate());
}

export function monthShort(date: string): string {
  return new Intl.DateTimeFormat('pt-BR', { month: 'short', timeZone: 'UTC' })
    .format(civil(date))
    .replace('.', '');
}

/** "Quinta-feira, 1 de outubro" — só a primeira letra em maiúscula. */
export function longDate(date: string): string {
  const s = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(civil(date));
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? '';
}
