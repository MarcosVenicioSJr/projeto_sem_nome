import {
  buildCatalog,
  buildIcs,
  eligiblePros,
  groupByDayPart,
  maskPhone,
  mergeSlots,
  quote,
  quoteRange,
  upcomingDays,
  validateClient,
  type Professional,
} from './booking';

const pros: Professional[] = [
  {
    id: 'p1',
    name: 'Romario',
    services: [
      { serviceId: 'corte', name: 'Corte', price: 35, durationMinutes: 40 },
      { serviceId: 'barba', name: 'Barba', price: 25, durationMinutes: 30 },
    ],
  },
  {
    id: 'p2',
    name: 'Caio',
    services: [
      { serviceId: 'corte', name: 'Corte', price: 30, durationMinutes: 45 },
    ],
  },
];

describe('catálogo', () => {
  it('agrega o mesmo serviço entre profissionais em faixas de preço e duração', () => {
    const corte = buildCatalog(pros).find((s) => s.id === 'corte');
    expect(corte).toMatchObject({
      minPrice: 30,
      maxPrice: 35,
      minDuration: 40,
      maxDuration: 45,
    });
  });

  it('ordena do mais barato para o mais caro', () => {
    expect(buildCatalog(pros).map((s) => s.id)).toEqual(['barba', 'corte']);
  });
});

describe('profissionais elegíveis', () => {
  it('só quem faz todos os serviços escolhidos', () => {
    expect(eligiblePros(pros, ['corte']).map((p) => p.id)).toEqual([
      'p1',
      'p2',
    ]);
    expect(eligiblePros(pros, ['corte', 'barba']).map((p) => p.id)).toEqual([
      'p1',
    ]);
  });

  it('soma preço e duração do combo', () => {
    expect(quote(pros[0], ['corte', 'barba'])).toEqual({
      price: 60,
      duration: 70,
    });
    expect(quoteRange(pros, ['corte'])).toEqual({
      minPrice: 30,
      maxPrice: 35,
      minDuration: 40,
      maxDuration: 45,
    });
    expect(quoteRange(pros, [])).toBeNull();
  });
});

describe('datas e horários', () => {
  it('conta os dias a partir de hoje no fuso da barbearia', () => {
    // 01:00 UTC do dia 1 ainda é dia 30 em Fortaleza (UTC−3).
    expect(
      upcomingDays(new Date('2026-10-01T01:00:00Z'), 3, 'America/Fortaleza'),
    ).toEqual(['2026-09-30', '2026-10-01', '2026-10-02']);
  });

  it('agrupa horários em manhã, tarde e noite', () => {
    const groups = groupByDayPart(
      [
        '2026-10-01T12:00:00.000Z',
        '2026-10-01T16:30:00.000Z',
        '2026-10-01T22:00:00.000Z',
      ],
      'America/Fortaleza',
    );
    expect(groups.map((g) => g.part)).toEqual(['manha', 'tarde', 'noite']);
  });

  it('"primeiro disponível" junta horários e mantém o primeiro profissional livre', () => {
    expect(
      mergeSlots([
        { proId: 'p1', slots: ['2026-10-01T13:00:00.000Z'] },
        {
          proId: 'p2',
          slots: ['2026-10-01T12:00:00.000Z', '2026-10-01T13:00:00.000Z'],
        },
      ]),
    ).toEqual([
      { startAt: '2026-10-01T12:00:00.000Z', proId: 'p2' },
      { startAt: '2026-10-01T13:00:00.000Z', proId: 'p1' },
    ]);
  });
});

describe('dados do cliente', () => {
  it('mascara o celular enquanto digita', () => {
    expect(maskPhone('8')).toBe('(8');
    expect(maskPhone('85999')).toBe('(85) 999');
    expect(maskPhone('85999998888123')).toBe('(85) 99999-8888');
  });

  it('valida como os schemas da API (nome ≥ 2, celular com 11 dígitos)', () => {
    expect(validateClient('M', '(85) 9999')).toEqual({
      name: expect.any(String),
      phone: expect.any(String),
    });
    expect(validateClient('Marcos', '(85) 99999-8888')).toEqual({});
  });
});

describe('arquivo de agenda (.ics)', () => {
  it('gera evento com horário em UTC e escapa texto', () => {
    const ics = buildIcs({
      uid: 'x@y',
      title: 'Corte, barba',
      description: 'Linha 1\nLinha 2',
      startAt: '2026-10-01T13:00:00.000Z',
      endAt: '2026-10-01T14:10:00.000Z',
      now: new Date('2026-09-30T00:00:00Z'),
    });
    expect(ics).toContain('DTSTART:20261001T130000Z');
    expect(ics).toContain('DTEND:20261001T141000Z');
    expect(ics).toContain('SUMMARY:Corte\\, barba');
    expect(ics).toContain('DESCRIPTION:Linha 1\\nLinha 2');
    expect(ics.split('\r\n')[0]).toBe('BEGIN:VCALENDAR');
  });
});
