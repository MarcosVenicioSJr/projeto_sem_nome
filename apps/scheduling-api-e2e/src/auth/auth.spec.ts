import axios from 'axios';

const uniq = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

const PASSWORD = 'Abcd1234';

/** Onboarding: creates a company + owner. */
async function createTenant() {
  const id = uniq();
  const slug = `clinica-${id}`;
  const ownerEmail = `dono-${id}@example.com`;
  const res = await axios.post('/api/tenants', {
    tenant: { name: `Clínica ${id}`, slug },
    owner: {
      name: 'Dona Clínica',
      email: ownerEmail,
      phone: '11987654321',
      password: PASSWORD,
    },
  });
  return { res, slug, ownerEmail };
}

const clientBody = (email: string) => ({
  name: 'Helena Cardoso',
  email,
  phone: '11912345678',
  password: PASSWORD,
});

const newClientEmail = () => `cliente-${uniq()}@example.com`;
const registerClient = (email: string) =>
  axios.post('/api/auth/client/register', clientBody(email));
const loginClient = (email: string, password = PASSWORD) =>
  axios.post('/api/auth/client/login', { email, password });
const loginMember = (email: string, password = PASSWORD) =>
  axios.post('/api/auth/member/login', { email, password });
const bearer = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` },
});
const me = (token: string) => axios.get('/api/user/me', bearer(token));
const join = (slug: string, token: string) =>
  axios.post(`/api/t/${slug}/clients/join`, {}, bearer(token));

describe('Tenants and auth (e2e)', () => {
  it('onboarding creates the tenant and its owner; owner logs in', async () => {
    const { res, slug, ownerEmail } = await createTenant();
    expect(res.status).toBe(201);
    expect(res.data.tenant.slug).toBe(slug);
    expect(res.data.owner.role).toBe('owner');
    expect(res.data.owner.tenantId).toBe(res.data.tenant.id);
    expect(res.data.owner).not.toHaveProperty('passwordHash');

    const session = await loginMember(ownerEmail);
    expect(session.status).toBe(200);
    const profile = await me(session.data.accessToken);
    expect(profile.data).toMatchObject({
      role: 'owner',
      email: ownerEmail,
      tenantId: res.data.tenant.id,
    });
  });

  it('rejects a taken slug or owner email with 409', async () => {
    const { slug, ownerEmail } = await createTenant();
    const body = (s: string, email: string) => ({
      tenant: { name: 'Outra', slug: s },
      owner: { name: 'Outro Dono', email, phone: '11987654321', password: PASSWORD },
    });

    const slugTaken = await axios.post('/api/tenants', body(slug, `x-${uniq()}@example.com`));
    expect(slugTaken.status).toBe(409);
    expect(slugTaken.data.code).toBe('errors.tenant.slugTaken');

    const emailTaken = await axios.post('/api/tenants', body(`outra-${uniq()}`, ownerEmail));
    expect(emailTaken.status).toBe(409);
    expect(emailTaken.data.code).toBe('errors.auth.emailTaken');
  });

  it('client registers globally, logs in and reads /user/me', async () => {
    const email = newClientEmail();
    const reg = await registerClient(email);
    expect(reg.status).toBe(201);
    expect(reg.data.role).toBe('client');
    expect(reg.data).not.toHaveProperty('tenantId');

    const session = await loginClient(email);
    expect(session.status).toBe(200);
    const profile = await me(session.data.accessToken);
    expect(profile.data).toMatchObject({ role: 'client', email });
  });

  it('client email is globally unique (409 on duplicate)', async () => {
    const email = newClientEmail();
    await registerClient(email);
    const dup = await registerClient(email);
    expect(dup.status).toBe(409);
    expect(dup.data.code).toBe('errors.auth.emailTaken');
  });

  it('the same client links to several tenants; joining twice is idempotent', async () => {
    const a = await createTenant();
    const b = await createTenant();
    const email = newClientEmail();
    await registerClient(email);
    const { accessToken } = (await loginClient(email)).data;

    const first = await join(a.slug, accessToken);
    expect(first.status).toBe(200);
    expect(first.data.slug).toBe(a.slug);
    expect((await join(a.slug, accessToken)).status).toBe(200);
    expect((await join(b.slug, accessToken)).status).toBe(200);
  });

  it('joining needs a client token and an existing tenant', async () => {
    const { slug, ownerEmail } = await createTenant();
    const ownerToken = (await loginMember(ownerEmail)).data.accessToken;

    const asOwner = await join(slug, ownerToken);
    expect(asOwner.status).toBe(403);
    expect(asOwner.data.code).toBe('errors.auth.forbidden');

    const anonymous = await axios.post(`/api/t/${slug}/clients/join`);
    expect(anonymous.status).toBe(401);

    const email = newClientEmail();
    await registerClient(email);
    const clientToken = (await loginClient(email)).data.accessToken;
    const missing = await join(`nao-existe-${uniq()}`, clientToken);
    expect(missing.status).toBe(404);
    expect(missing.data.code).toBe('errors.tenant.notFound');
  });

  it('public tenant page data is available by slug', async () => {
    const { slug } = await createTenant();
    const res = await axios.get(`/api/t/${slug}`);
    expect(res.status).toBe(200);
    expect(res.data.slug).toBe(slug);
    expect(res.data).not.toHaveProperty('id');
  });

  describe('employees', () => {
    const employeeBody = () => ({
      name: 'Ana Atendente',
      email: `func-${uniq()}@example.com`,
      phone: '11955554444',
      password: PASSWORD,
    });
    const asOwner = async () => {
      const t = await createTenant();
      const token = (await loginMember(t.ownerEmail)).data.accessToken as string;
      return { ...t, token };
    };
    const createEmployee = (token: string, body = employeeBody()) =>
      axios.post('/api/members/employees', body, bearer(token));

    it('owner creates an employee who logs in with a tenant-bound token', async () => {
      const owner = await asOwner();
      const body = employeeBody();
      const created = await createEmployee(owner.token, body);
      expect(created.status).toBe(201);
      expect(created.data).toMatchObject({
        role: 'employee',
        tenantId: owner.res.data.tenant.id,
      });
      expect(created.data).not.toHaveProperty('passwordHash');

      const session = await loginMember(body.email);
      expect(session.status).toBe(200);
      const profile = await me(session.data.accessToken);
      expect(profile.data).toMatchObject({
        role: 'employee',
        tenantId: owner.res.data.tenant.id,
      });
    });

    it('owner lists and updates only their own tenant employees', async () => {
      const a = await asOwner();
      const b = await asOwner();
      const emp = (await createEmployee(a.token)).data;
      await createEmployee(b.token);

      const list = await axios.get('/api/members/employees', bearer(a.token));
      expect(list.status).toBe(200);
      expect(list.data.map((e: { id: string }) => e.id)).toEqual([emp.id]);

      const upd = await axios.patch(
        `/api/members/employees/${emp.id}`,
        { name: 'Ana Renomeada' },
        bearer(a.token),
      );
      expect(upd.status).toBe(200);
      expect(upd.data.name).toBe('Ana Renomeada');

      const cross = await axios.patch(
        `/api/members/employees/${emp.id}`,
        { name: 'Invasor' },
        bearer(b.token),
      );
      expect(cross.status).toBe(404);
      expect(cross.data.code).toBe('errors.member.notFound');
    });

    it('rejects an employee email that is already a member', async () => {
      const owner = await asOwner();
      const dup = await createEmployee(owner.token, {
        ...employeeBody(),
        email: owner.ownerEmail,
      });
      expect(dup.status).toBe(409);
      expect(dup.data.code).toBe('errors.auth.emailTaken');
    });

    it('employees and clients cannot manage employees or edit their profile', async () => {
      const owner = await asOwner();
      const body = employeeBody();
      await createEmployee(owner.token, body);
      const empToken = (await loginMember(body.email)).data.accessToken;

      const create = await createEmployee(empToken);
      expect(create.status).toBe(403);
      expect(create.data.code).toBe('errors.auth.forbidden');
      expect((await axios.get('/api/members/employees', bearer(empToken))).status).toBe(403);

      const patchMe = await axios.patch('/api/user/me', { name: 'Novo Nome' }, bearer(empToken));
      expect(patchMe.status).toBe(403);

      const email = newClientEmail();
      await registerClient(email);
      const clientToken = (await loginClient(email)).data.accessToken;
      expect((await createEmployee(clientToken)).status).toBe(403);
      expect(
        (await axios.patch('/api/user/me', { name: 'Novo Nome' }, bearer(clientToken))).status,
      ).toBe(200);
    });

    it('an employee cannot join a booking link (client only)', async () => {
      const owner = await asOwner();
      const body = employeeBody();
      await createEmployee(owner.token, body);
      const empToken = (await loginMember(body.email)).data.accessToken;
      expect((await join(owner.slug, empToken)).status).toBe(403);
    });
  });

  it('client and owner logins are separate', async () => {
    const { ownerEmail } = await createTenant();
    const email = newClientEmail();
    await registerClient(email);

    expect((await loginClient(ownerEmail)).status).toBe(401);
    expect((await loginMember(email)).status).toBe(401);
  });

  it('rejects a bad body with a localized 422 (Accept-Language)', async () => {
    const post = (lang: string) =>
      axios.post(
        '/api/auth/client/register',
        { ...clientBody(newClientEmail()), phone: '123' },
        { headers: { 'Accept-Language': lang } },
      );
    const find = (data: { issues: { path: string; message: string }[] }) =>
      data.issues.find((i) => i.path === 'phone');

    const en = await post('en');
    expect(en.status).toBe(422);
    expect(find(en.data)?.message).toMatch(/11 digits/i);

    const pt = await post('pt-BR');
    expect(find(pt.data)?.message).toMatch(/11 dígitos/i);
  });

  it('login with wrong credentials is a generic 401', async () => {
    const res = await loginClient(newClientEmail(), 'whatever');
    expect(res.status).toBe(401);
    expect(res.data.code).toBe('errors.auth.invalidCredentials');
  });

  it('GET /user/me without a token is 401', async () => {
    const res = await axios.get('/api/user/me');
    expect(res.status).toBe(401);
    expect(res.data.code).toBe('errors.auth.tokenMissing');
  });
});
