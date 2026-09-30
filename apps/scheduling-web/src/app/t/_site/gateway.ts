import { ApiError, apiRequest } from '../../_lib/api';
import type { Professional } from './booking';

/**
 * Porta de acesso aos dados do agendamento público. A página não sabe se
 * fala com a API de verdade ou com a demonstração — só com esta interface.
 */
export type BookingResult = {
  id: string;
  startAt: string;
  endAt: string;
  cancelToken: string;
};

export type BookingGateway = {
  readonly demo: boolean;
  shop(slug: string): Promise<{ name: string; slug: string }>;
  professionals(slug: string): Promise<Professional[]>;
  slots(
    slug: string,
    q: { professionalId: string; date: string; serviceIds: string[] },
  ): Promise<string[]>;
  book(
    slug: string,
    body: {
      professionalId: string;
      serviceIds: string[];
      clientName: string;
      clientPhone: string;
      startAt: string;
    },
  ): Promise<BookingResult>;
  cancel(token: string): Promise<void>;
};

const enc = encodeURIComponent;

export const apiGateway: BookingGateway = {
  demo: false,
  shop: (slug) => apiRequest(`/t/${enc(slug)}`),
  professionals: (slug) => apiRequest(`/t/${enc(slug)}/agenda/professionals`),
  slots: (slug, q) =>
    apiRequest(
      `/t/${enc(slug)}/agenda/slots?professionalId=${enc(q.professionalId)}&date=${enc(q.date)}&serviceIds=${enc(q.serviceIds.join(','))}`,
    ),
  book: (slug, body) =>
    apiRequest(`/t/${enc(slug)}/agenda/appointments`, { method: 'POST', body }),
  cancel: async (token) => {
    await apiRequest(`/agenda/cancel/${enc(token)}`, { method: 'POST' });
  },
};

// ── demonstração ────────────────────────────────────────────────────
// Ativada com NEXT_PUBLIC_BOOKING_DEMO=1. Serve para apresentar o site sem
// a API rodando. A página exibe um aviso fixo: nada é reservado de verdade.

const DEMO_PROS: Professional[] = [
  {
    id: 'demo-pro-1',
    name: 'Romario',
    services: [
      {
        serviceId: 'demo-corte',
        name: 'Corte degradê',
        price: 35,
        durationMinutes: 40,
      },
      {
        serviceId: 'demo-barba',
        name: 'Barba na navalha',
        price: 25,
        durationMinutes: 30,
      },
      {
        serviceId: 'demo-sobrancelha',
        name: 'Sobrancelha',
        price: 10,
        durationMinutes: 10,
      },
      {
        serviceId: 'demo-pigmentacao',
        name: 'Pigmentação',
        price: 20,
        durationMinutes: 20,
      },
      {
        serviceId: 'demo-luzes',
        name: 'Luzes / nevou',
        price: 80,
        durationMinutes: 90,
      },
    ],
  },
  {
    id: 'demo-pro-2',
    name: 'Barbeiro 2',
    services: [
      {
        serviceId: 'demo-corte',
        name: 'Corte degradê',
        price: 30,
        durationMinutes: 40,
      },
      {
        serviceId: 'demo-barba',
        name: 'Barba na navalha',
        price: 25,
        durationMinutes: 30,
      },
      {
        serviceId: 'demo-sobrancelha',
        name: 'Sobrancelha',
        price: 10,
        durationMinutes: 10,
      },
    ],
  },
];

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Pseudoaleatório estável por string, para os horários não "pularem" a cada clique. */
function seeded(key: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++)
    h = Math.imul(h ^ key.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

export const demoGateway: BookingGateway = {
  demo: true,
  async shop(slug) {
    await wait(200);
    return { name: '', slug };
  },
  async professionals() {
    await wait(350);
    return DEMO_PROS;
  },
  async slots(_slug, q) {
    await wait(250 + Math.random() * 250);
    const civil = new Date(`${q.date}T12:00:00Z`);
    if (civil.getUTCDay() === 0) return []; // domingo fechado
    const rand = seeded(`${q.professionalId}|${q.date}`);
    const out: string[] = [];
    const earliest = Date.now() + 60 * 60_000;
    for (let min = 9 * 60; min <= 19 * 60 + 30; min += 30) {
      if (min >= 12 * 60 && min < 13 * 60) continue; // almoço
      if (rand() < 0.42) continue; // já ocupado
      const [y, m, d] = q.date.split('-').map(Number);
      const at = new Date(Date.UTC(y, m - 1, d, 0, min) + 180 * 60_000); // UTC−3
      if (at.getTime() >= earliest) out.push(at.toISOString());
    }
    return out;
  },
  async book(_slug, body) {
    await wait(700);
    const pro = DEMO_PROS.find((p) => p.id === body.professionalId);
    const duration = body.serviceIds.reduce(
      (sum, id) =>
        sum +
        (pro?.services.find((s) => s.serviceId === id)?.durationMinutes ?? 0),
      0,
    );
    return {
      id: `demo-${Date.now()}`,
      startAt: body.startAt,
      endAt: new Date(
        new Date(body.startAt).getTime() + duration * 60_000,
      ).toISOString(),
      cancelToken: 'demonstracao',
    };
  },
  async cancel(token) {
    await wait(500);
    if (token !== 'demonstracao')
      throw new ApiError(
        404,
        'errors.agenda.notFound',
        'Agendamento não encontrado',
      );
  },
};

export const gateway: BookingGateway =
  process.env.NEXT_PUBLIC_BOOKING_DEMO === '1' ? demoGateway : apiGateway;
