/**
 * Regras puras do agendamento público — sem React, sem rede. Tudo aqui é
 * testado em `booking.spec.ts`.
 */

export type OfferedService = {
  serviceId: string;
  name: string;
  price: number;
  durationMinutes: number;
};

export type Professional = {
  id: string;
  name: string;
  services: OfferedService[];
};

/** Um serviço como o cliente vê: agregado entre todos os profissionais. */
export type CatalogService = {
  id: string;
  name: string;
  minPrice: number;
  maxPrice: number;
  minDuration: number;
  maxDuration: number;
};

export function buildCatalog(pros: Professional[]): CatalogService[] {
  const byId = new Map<string, CatalogService>();
  for (const pro of pros) {
    for (const s of pro.services) {
      const cur = byId.get(s.serviceId);
      if (!cur) {
        byId.set(s.serviceId, {
          id: s.serviceId,
          name: s.name,
          minPrice: s.price,
          maxPrice: s.price,
          minDuration: s.durationMinutes,
          maxDuration: s.durationMinutes,
        });
      } else {
        cur.minPrice = Math.min(cur.minPrice, s.price);
        cur.maxPrice = Math.max(cur.maxPrice, s.price);
        cur.minDuration = Math.min(cur.minDuration, s.durationMinutes);
        cur.maxDuration = Math.max(cur.maxDuration, s.durationMinutes);
      }
    }
  }
  return [...byId.values()].sort(
    (a, b) => a.minPrice - b.minPrice || a.name.localeCompare(b.name, 'pt-BR'),
  );
}

/** Profissionais que fazem TODOS os serviços escolhidos. */
export function eligiblePros(
  pros: Professional[],
  serviceIds: string[],
): Professional[] {
  if (serviceIds.length === 0) return pros;
  return pros.filter((p) =>
    serviceIds.every((id) => p.services.some((s) => s.serviceId === id)),
  );
}

/** Preço e duração que esse profissional cobra pela combinação escolhida. */
export function quote(
  pro: Professional,
  serviceIds: string[],
): { price: number; duration: number } {
  return serviceIds.reduce(
    (acc, id) => {
      const s = pro.services.find((x) => x.serviceId === id);
      return s
        ? {
            price: acc.price + s.price,
            duration: acc.duration + s.durationMinutes,
          }
        : acc;
    },
    { price: 0, duration: 0 },
  );
}

/** Faixa de preço/duração da seleção, considerando quem pode atender. */
export function quoteRange(pros: Professional[], serviceIds: string[]) {
  const quotes = eligiblePros(pros, serviceIds).map((p) =>
    quote(p, serviceIds),
  );
  if (quotes.length === 0 || serviceIds.length === 0) return null;
  return {
    minPrice: Math.min(...quotes.map((q) => q.price)),
    maxPrice: Math.max(...quotes.map((q) => q.price)),
    minDuration: Math.min(...quotes.map((q) => q.duration)),
    maxDuration: Math.max(...quotes.map((q) => q.duration)),
  };
}

// ── datas e horários ────────────────────────────────────────────────

/** `YYYY-MM-DD` do instante no fuso da barbearia. */
export function isoDateIn(instant: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instant);
}

/** Próximos `count` dias (a partir de hoje, no fuso da barbearia). */
export function upcomingDays(
  now: Date,
  count: number,
  timeZone: string,
): string[] {
  const days: string[] = [];
  // Meio-dia UTC evita pular/repetir dia por causa do fuso.
  const [y, m, d] = isoDateIn(now, timeZone).split('-').map(Number);
  for (let i = 0; i < count; i++) {
    days.push(
      new Date(Date.UTC(y, m - 1, d + i, 12)).toISOString().slice(0, 10),
    );
  }
  return days;
}

export type DayPart = 'manha' | 'tarde' | 'noite';

export const DAY_PART_LABEL: Record<DayPart, string> = {
  manha: 'Manhã',
  tarde: 'Tarde',
  noite: 'Noite',
};

export function hourIn(iso: string, timeZone: string): number {
  return Number(
    new Intl.DateTimeFormat('en-GB', {
      timeZone,
      hour: '2-digit',
      hour12: false,
    }).format(new Date(iso)),
  );
}

export function groupByDayPart(
  slots: string[],
  timeZone: string,
): Array<{ part: DayPart; slots: string[] }> {
  const groups: Record<DayPart, string[]> = { manha: [], tarde: [], noite: [] };
  for (const s of slots) {
    const h = hourIn(s, timeZone);
    groups[h < 12 ? 'manha' : h < 18 ? 'tarde' : 'noite'].push(s);
  }
  return (Object.keys(groups) as DayPart[])
    .filter((p) => groups[p].length > 0)
    .map((part) => ({ part, slots: groups[part] }));
}

/**
 * "Primeiro disponível": junta os horários de vários profissionais.
 * Para cada horário fica o primeiro profissional (na ordem recebida) livre.
 */
export function mergeSlots(
  byPro: Array<{ proId: string; slots: string[] }>,
): Array<{ startAt: string; proId: string }> {
  const map = new Map<string, string>();
  for (const { proId, slots } of byPro) {
    for (const s of slots) if (!map.has(s)) map.set(s, proId);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([startAt, proId]) => ({ startAt, proId }));
}

// ── dados do cliente ────────────────────────────────────────────────

export function onlyDigits(v: string): string {
  return v.replace(/\D/g, '');
}

/** Máscara progressiva: (85) 99999-9999. */
export function maskPhone(v: string): string {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length === 0) return '';
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export type ClientErrors = Partial<Record<'name' | 'phone', string>>;

/** Espelha `nameSchema` e `phoneSchema` de @org/contracts. */
export function validateClient(name: string, phone: string): ClientErrors {
  const errors: ClientErrors = {};
  const n = name.trim();
  if (n.length < 2)
    errors.name = 'Diga como podemos te chamar (mínimo 2 letras).';
  else if (n.length > 120) errors.name = 'Nome muito longo.';
  const digits = onlyDigits(phone);
  if (digits.length !== 11)
    errors.phone = 'Informe o celular com DDD: 11 números.';
  return errors;
}

// ── agenda do cliente ───────────────────────────────────────────────

function icsDate(d: Date): string {
  return d
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
}

function icsEscape(v: string): string {
  return v
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/** Arquivo .ics para "Adicionar à agenda" — funciona no iPhone, Android e desktop. */
export function buildIcs(input: {
  uid: string;
  title: string;
  description: string;
  location?: string;
  startAt: string;
  endAt: string;
  now?: Date;
}): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Barber Admin//Agendamento//PT-BR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${input.uid}`,
    `DTSTAMP:${icsDate(input.now ?? new Date())}`,
    `DTSTART:${icsDate(new Date(input.startAt))}`,
    `DTEND:${icsDate(new Date(input.endAt))}`,
    `SUMMARY:${icsEscape(input.title)}`,
    `DESCRIPTION:${icsEscape(input.description)}`,
    ...(input.location ? [`LOCATION:${icsEscape(input.location)}`] : []),
    'BEGIN:VALARM',
    'TRIGGER:-PT1H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Seu horário na barbearia é em 1 hora',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lines.join('\r\n');
}
