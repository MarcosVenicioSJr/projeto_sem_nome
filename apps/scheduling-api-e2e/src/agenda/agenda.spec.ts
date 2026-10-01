import axios from 'axios';

const uniq = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

const PASSWORD = 'Abcd1234';
const bearer = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` },
});

/** The tenant's local "tomorrow" (UTC-3), as `YYYY-MM-DD`. */
const tomorrowLocal = () => {
  const d = new Date(Date.now() - 3 * 3600_000 + 24 * 3600_000);
  return d.toISOString().slice(0, 10);
};

/** A tenant with one professional (40% commission) offering "Corte" (30 min, R$ 50) and "Barba" (20 min, R$ 30), open every day 09:00-18:00 with lunch at 12:00. */
async function setup() {
  const id = uniq();
  const slug = `agenda-${id}`;
  const ownerEmail = `dono-${id}@example.com`;
  await axios.post('/api/tenants', {
    tenant: { name: `Agenda ${id}`, slug },
    owner: {
      name: 'Dono Agenda',
      email: ownerEmail,
      phone: '11987654321',
      password: PASSWORD,
    },
  });
  const owner = (
    await axios.post('/api/auth/member/login', {
      email: ownerEmail,
      password: PASSWORD,
    })
  ).data.accessToken as string;

  const professionalEmail = `pro-${id}@example.com`;
  const professional = (
    await axios.post(
      '/api/members/employees',
      {
        name: 'Profissional Um',
        email: professionalEmail,
        phone: '11911112222',
        password: PASSWORD,
        commissionRate: 40,
      },
      bearer(owner),
    )
  ).data;

  const cut = (
    await axios.post('/api/services', { name: 'Corte' }, bearer(owner))
  ).data;
  const beard = (
    await axios.post('/api/services', { name: 'Barba' }, bearer(owner))
  ).data;
  await axios.put(
    `/api/members/${professional.id}/services`,
    { serviceId: cut.id, price: 50, durationMinutes: 30 },
    bearer(owner),
  );
  await axios.put(
    `/api/members/${professional.id}/services`,
    { serviceId: beard.id, price: 30, durationMinutes: 20 },
    bearer(owner),
  );
  await axios.put(
    `/api/members/${professional.id}/schedule`,
    {
      days: [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
        weekday,
        startMinute: 540,
        endMinute: 1080,
        breakStartMinute: 720,
        breakEndMinute: 780,
      })),
    },
    bearer(owner),
  );
  return { slug, owner, professional, professionalEmail, cut, beard };
}

const book = (
  slug: string,
  body: {
    professionalId: string;
    serviceIds: string[];
    startAt: string;
    clientPhone: string;
  },
) =>
  axios.post(`/api/t/${slug}/agenda/appointments`, {
    clientName: 'Helena Cardoso',
    ...body,
  });

describe('Agenda (e2e)', () => {
  it('lists the professionals and their services on the public page', async () => {
    const t = await setup();
    const res = await axios.get(`/api/t/${t.slug}/agenda/professionals`);
    expect(res.status).toBe(200);
    expect(res.data).toHaveLength(1);
    expect(
      res.data[0].services.map((s: { name: string }) => s.name).sort(),
    ).toEqual(['Barba', 'Corte']);
  });

  it('offers slots that respect hours and lunch, and books without any account', async () => {
    const t = await setup();
    const date = tomorrowLocal();
    const slots = await axios.get(
      `/api/t/${t.slug}/agenda/slots?professionalId=${t.professional.id}&date=${date}&serviceIds=${t.cut.id}`,
    );
    expect(slots.status).toBe(200);
    // 09:00 local = 12:00Z; nothing inside the 12:00-13:00 local lunch (15:00Z-16:00Z)
    expect(slots.data[0]).toBe(`${date}T12:00:00.000Z`);
    expect(slots.data).not.toContain(`${date}T15:15:00.000Z`);

    const booked = await book(t.slug, {
      professionalId: t.professional.id,
      serviceIds: [t.cut.id],
      startAt: slots.data[0],
      clientPhone: '11999990001',
    });
    expect(booked.status).toBe(201);
    expect(booked.data).toMatchObject({
      status: 'confirmed',
      clientName: 'Helena Cardoso',
      endAt: `${date}T12:30:00.000Z`,
    });
    expect(booked.data.cancelToken).toEqual(expect.any(String));

    const after = await axios.get(
      `/api/t/${t.slug}/agenda/slots?professionalId=${t.professional.id}&date=${date}&serviceIds=${t.cut.id}`,
    );
    expect(after.data).not.toContain(slots.data[0]);
  });

  it('refuses a booking with less than 1 hour of notice', async () => {
    const t = await setup();
    const res = await book(t.slug, {
      professionalId: t.professional.id,
      serviceIds: [t.cut.id],
      startAt: new Date(Date.now() + 20 * 60_000).toISOString(),
      clientPhone: '11999990002',
    });
    expect(res.status).toBe(422);
    expect(res.data.code).toBe('errors.agenda.leadTime');
  });

  it('allows 2 back-to-back bookings per phone and blocks the 3rd', async () => {
    const t = await setup();
    const date = tomorrowLocal();
    const phone = '11999990003';
    const first = await book(t.slug, {
      professionalId: t.professional.id,
      serviceIds: [t.cut.id],
      startAt: `${date}T13:00:00.000Z`,
      clientPhone: phone,
    });
    expect(first.status).toBe(201);

    const notSequential = await book(t.slug, {
      professionalId: t.professional.id,
      serviceIds: [t.beard.id],
      startAt: `${date}T19:00:00.000Z`,
      clientPhone: phone,
    });
    expect(notSequential.status).toBe(409);
    expect(notSequential.data.code).toBe('errors.agenda.dailyLimit');

    const second = await book(t.slug, {
      professionalId: t.professional.id,
      serviceIds: [t.beard.id],
      startAt: first.data.endAt,
      clientPhone: phone,
    });
    expect(second.status).toBe(201);

    const third = await book(t.slug, {
      professionalId: t.professional.id,
      serviceIds: [t.beard.id],
      startAt: second.data.endAt,
      clientPhone: phone,
    });
    expect(third.status).toBe(409);
    expect(third.data.code).toBe('errors.agenda.dailyLimit');
  });

  it('refuses a time that is already taken', async () => {
    const t = await setup();
    const startAt = `${tomorrowLocal()}T14:00:00.000Z`;
    const args = {
      professionalId: t.professional.id,
      serviceIds: [t.cut.id],
      startAt,
    };
    expect(
      (await book(t.slug, { ...args, clientPhone: '11999990004' })).status,
    ).toBe(201);
    const clash = await book(t.slug, { ...args, clientPhone: '11999990005' });
    expect(clash.status).toBe(409);
    expect(clash.data.code).toBe('errors.agenda.slotUnavailable');
  });

  it('cancels through the link, once', async () => {
    const t = await setup();
    const booked = await book(t.slug, {
      professionalId: t.professional.id,
      serviceIds: [t.cut.id],
      startAt: `${tomorrowLocal()}T13:00:00.000Z`,
      clientPhone: '11999990006',
    });
    const cancel = await axios.post(
      `/api/agenda/cancel/${booked.data.cancelToken}`,
    );
    expect(cancel.status).toBe(200);
    expect(cancel.data.status).toBe('cancelled');

    const again = await axios.post(
      `/api/agenda/cancel/${booked.data.cancelToken}`,
    );
    expect(again.status).toBe(409);
    expect(
      (await axios.post(`/api/agenda/cancel/${'x'.repeat(30)}`)).status,
    ).toBe(404);
  });

  it('completing an appointment records revenue; commission and reports follow', async () => {
    const t = await setup();
    const date = tomorrowLocal();
    const phone = '11999990007';
    const first = await book(t.slug, {
      professionalId: t.professional.id,
      serviceIds: [t.cut.id],
      startAt: `${date}T13:00:00.000Z`,
      clientPhone: phone,
    });
    const second = await book(t.slug, {
      professionalId: t.professional.id,
      serviceIds: [t.beard.id],
      startAt: first.data.endAt,
      clientPhone: phone,
    });

    const day = await axios.get(`/api/agenda?date=${date}`, bearer(t.owner));
    expect(day.data).toHaveLength(2);

    const done = await axios.patch(
      `/api/agenda/${first.data.id}/done`,
      { amount: 55.5, paymentMethod: 'pix' },
      bearer(t.owner),
    );
    expect(done.status).toBe(200);
    expect(done.data.status).toBe('done');
    expect(
      (
        await axios.patch(
          `/api/agenda/${first.data.id}/done`,
          { amount: 55.5, paymentMethod: 'pix' },
          bearer(t.owner),
        )
      ).status,
    ).toBe(409);

    // Commission base: every non-cancelled service of the day (R$ 50 + R$ 30) x 40%
    const commissions = await axios.get(
      `/api/finance/commissions?date=${date}`,
      bearer(t.owner),
    );
    expect(commissions.data).toEqual([
      expect.objectContaining({
        professionalId: t.professional.id,
        servicesDone: 2,
        servicesTotal: 80,
        commissionRate: 40,
        commission: 32,
      }),
    ]);

    // Counter cancels the second one (e.g. a no-show): it leaves the commission base
    expect(
      (
        await axios.patch(
          `/api/agenda/${second.data.id}/cancel`,
          {},
          bearer(t.owner),
        )
      ).status,
    ).toBe(200);
    const after = await axios.get(
      `/api/finance/commissions?date=${date}`,
      bearer(t.owner),
    );
    expect(after.data[0]).toMatchObject({
      servicesDone: 1,
      servicesTotal: 50,
      commission: 20,
    });

    const month = date.slice(0, 7);
    const revenue = await axios.get(
      `/api/finance/reports/revenue?month=${month}`,
      bearer(t.owner),
    );
    expect(revenue.data).toEqual({ month, total: 55.5 });
    const clients = await axios.get(
      `/api/finance/reports/clients?month=${month}`,
      bearer(t.owner),
    );
    expect(clients.data).toEqual({ month, clients: 1 });
  });

  it('employees only see and act on their own agenda; finance is management only', async () => {
    const t = await setup();
    const employee = (
      await axios.post('/api/auth/member/login', {
        email: t.professionalEmail,
        password: PASSWORD,
      })
    ).data.accessToken as string;

    expect(
      (await axios.get('/api/finance/expenses', bearer(employee))).status,
    ).toBe(403);
    expect(
      (await axios.post('/api/services', { name: 'Outro' }, bearer(employee)))
        .status,
    ).toBe(403);
    expect(
      (await axios.get(`/api/agenda?date=${tomorrowLocal()}`, bearer(employee)))
        .status,
    ).toBe(200);
    expect(
      (
        await axios.get(
          `/api/members/${t.professional.id}/services`,
          bearer(employee),
        )
      ).status,
    ).toBe(200);
    const ownerId = (await axios.get('/api/user/me', bearer(t.owner))).data.id;
    expect(
      (await axios.get(`/api/members/${ownerId}/services`, bearer(employee)))
        .status,
    ).toBe(403);
  });
});

describe('Counter (staff) booking and finance lists (e2e)', () => {
  it('staff can book inside the 1 h notice window and beyond the phone limit; clients cannot', async () => {
    const t = await setup();
    const date = tomorrowLocal();
    const phone = '11999990010';
    const starts = ['13:00', '14:00', '14:30'].map(
      (h) => `${date}T${h}:00.000Z`,
    );

    // staff slots have no 1 h notice, and the counter can exceed 2 bookings per phone
    const slots = await axios.get(
      `/api/agenda/slots?professionalId=${t.professional.id}&date=${date}&serviceIds=${t.cut.id}`,
      bearer(t.owner),
    );
    expect(slots.status).toBe(200);
    expect(slots.data).toContain(starts[0]);

    for (const startAt of starts) {
      const res = await axios.post(
        '/api/agenda/appointments',
        {
          professionalId: t.professional.id,
          serviceIds: [t.cut.id],
          clientName: 'Cliente Balcão',
          clientPhone: phone,
          startAt,
        },
        bearer(t.owner),
      );
      expect(res.status).toBe(201);
    }
    // the public flow still refuses the 3rd for the same phone
    const publicThird = await book(t.slug, {
      professionalId: t.professional.id,
      serviceIds: [t.cut.id],
      startAt: `${date}T16:00:00.000Z`,
      clientPhone: phone,
    });
    expect(publicThird.status).toBe(409);
    // a taken time is refused for staff too
    const clash = await axios.post(
      '/api/agenda/appointments',
      {
        professionalId: t.professional.id,
        serviceIds: [t.cut.id],
        clientName: 'Outro',
        clientPhone: '11999990011',
        startAt: starts[0],
      },
      bearer(t.owner),
    );
    expect(clash.status).toBe(409);
    expect(clash.data.code).toBe('errors.agenda.slotUnavailable');
  });

  it('an employee books only for themself; the team, offers and tenant endpoints are scoped', async () => {
    const t = await setup();
    const employee = (
      await axios.post('/api/auth/member/login', {
        email: t.professionalEmail,
        password: PASSWORD,
      })
    ).data.accessToken as string;
    const ownerId = (await axios.get('/api/user/me', bearer(t.owner))).data.id;
    const startAt = `${tomorrowLocal()}T13:00:00.000Z`;

    const forOwner = await axios.post(
      '/api/agenda/appointments',
      {
        professionalId: ownerId,
        serviceIds: [t.cut.id],
        clientName: 'X Y',
        clientPhone: '11999990012',
        startAt,
      },
      bearer(employee),
    );
    expect(forOwner.status).toBe(403);

    const team = await axios.get('/api/members', bearer(t.owner));
    expect(team.data.map((m: { role: string }) => m.role).sort()).toEqual([
      'employee',
      'owner',
    ]);
    expect((await axios.get('/api/members', bearer(employee))).status).toBe(
      403,
    );

    const offers = await axios.get('/api/services/offers', bearer(t.owner));
    expect(offers.data).toHaveLength(2);
    expect(
      (await axios.get('/api/services/offers', bearer(employee))).status,
    ).toBe(403);

    const tenant = await axios.get('/api/tenants/me', bearer(employee));
    expect(tenant.status).toBe(200);
    expect(tenant.data.slug).toBe(t.slug);
    expect((await axios.get('/api/tenants/me')).status).toBe(401);
  });

  it('lists the received payments of the day with method, professional and services', async () => {
    const t = await setup();
    const date = tomorrowLocal();
    const booked = await axios.post(
      '/api/agenda/appointments',
      {
        professionalId: t.professional.id,
        serviceIds: [t.cut.id, t.beard.id],
        clientName: 'Helena Cardoso',
        clientPhone: '11999990013',
        startAt: `${date}T13:00:00.000Z`,
      },
      bearer(t.owner),
    );
    expect(booked.data.endAt).toBe(`${date}T13:50:00.000Z`); // 30 + 20 min
    await axios.patch(
      `/api/agenda/${booked.data.id}/done`,
      { amount: 80, paymentMethod: 'credit' },
      bearer(t.owner),
    );

    const lines = await axios.get(
      `/api/finance/revenues?date=${date}`,
      bearer(t.owner),
    );
    expect(lines.data).toEqual([
      expect.objectContaining({
        clientName: 'Helena Cardoso',
        professionalName: 'Profissional Um',
        services: 'Barba + Corte',
        amount: 80,
        paymentMethod: 'credit',
      }),
    ]);
  });
});

describe('Stock, products and expenses (e2e)', () => {
  it('stock adjusts atomically and flags low stock; products and expenses are management only', async () => {
    const t = await setup();
    const employee = (
      await axios.post('/api/auth/member/login', {
        email: t.professionalEmail,
        password: PASSWORD,
      })
    ).data.accessToken as string;

    const item = (
      await axios.post(
        '/api/stock-items',
        { name: 'Lâmina', quantity: 10, unit: 'un', minQuantity: 5 },
        bearer(t.owner),
      )
    ).data;
    expect(item.lowStock).toBe(false);

    const tooMuch = await axios.patch(
      `/api/stock-items/${item.id}/quantity`,
      { delta: -100 },
      bearer(employee),
    );
    expect(tooMuch.status).toBe(409);
    expect(tooMuch.data.code).toBe('errors.stock.negative');

    const used = await axios.patch(
      `/api/stock-items/${item.id}/quantity`,
      { delta: -6 },
      bearer(employee),
    );
    expect(used.data).toMatchObject({ quantity: 4, lowStock: true });

    const product = await axios.post(
      '/api/products',
      { name: 'Pomada', price: 39.9, cost: 20, quantity: 12 },
      bearer(t.owner),
    );
    expect(product.status).toBe(201);
    expect(
      (
        await axios.post(
          '/api/products',
          { name: 'Pomada', price: 1 },
          bearer(employee),
        )
      ).status,
    ).toBe(403);

    const expense = await axios.post(
      '/api/finance/expenses',
      {
        description: 'Aluguel',
        category: 'Fixa',
        amount: 1500,
        date: tomorrowLocal(),
        recurring: true,
      },
      bearer(t.owner),
    );
    expect(expense.status).toBe(201);
    expect(
      (await axios.get('/api/finance/expenses', bearer(t.owner))).data,
    ).toHaveLength(1);
  });
});
