import axios from 'axios';

const uniq = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

const PASSWORD = 'Abcd1234';

/** Onboarding: creates a company + owner. */
async function createTenant() {
  const id = uniq();
  const slug = `empresa-${id}`;
  const ownerEmail = `dono-${id}@example.com`;
  const res = await axios.post('/api/tenants', {
    tenant: { name: `Empresa ${id}`, slug },
    owner: {
      name: 'Dona Empresa',
      email: ownerEmail,
      phone: '11987654321',
      password: PASSWORD,
    },
  });
  return { res, slug, ownerEmail };
}

const loginMember = (email: string, password = PASSWORD) =>
  axios.post('/api/auth/member/login', { email, password });
const bearer = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` },
});
const me = (token: string) => axios.get('/api/user/me', bearer(token));

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
      owner: {
        name: 'Outro Dono',
        email,
        phone: '11987654321',
        password: PASSWORD,
      },
    });

    const slugTaken = await axios.post(
      '/api/tenants',
      body(slug, `x-${uniq()}@example.com`),
    );
    expect(slugTaken.status).toBe(409);
    expect(slugTaken.data.code).toBe('errors.tenant.slugTaken');

    const emailTaken = await axios.post(
      '/api/tenants',
      body(`outra-${uniq()}`, ownerEmail),
    );
    expect(emailTaken.status).toBe(409);
    expect(emailTaken.data.code).toBe('errors.auth.emailTaken');
  });

  it('public tenant page data is available by slug', async () => {
    const { slug } = await createTenant();
    const res = await axios.get(`/api/t/${slug}`);
    expect(res.status).toBe(200);
    expect(res.data.slug).toBe(slug);
    expect(res.data).not.toHaveProperty('id');
  });

  it('end customers have no account: the client auth routes are gone', async () => {
    const register = await axios.post('/api/auth/client/register', {});
    const login = await axios.post('/api/auth/client/login', {});
    expect(register.status).toBe(404);
    expect(login.status).toBe(404);
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
      const token = (await loginMember(t.ownerEmail)).data
        .accessToken as string;
      return { ...t, token };
    };
    const createEmployee = (token: string, body: object = employeeBody()) =>
      axios.post('/api/members/employees', body, bearer(token));

    it('owner creates an employee who logs in with a tenant-bound token', async () => {
      const owner = await asOwner();
      const body = employeeBody();
      const created = await createEmployee(owner.token, {
        ...body,
        commissionRate: 40,
      });
      expect(created.status).toBe(201);
      expect(created.data).toMatchObject({
        role: 'employee',
        tenantId: owner.res.data.tenant.id,
        commissionRate: 40,
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

    it('owner can create a manager, who can manage but has a tenant-bound token', async () => {
      const owner = await asOwner();
      const body = employeeBody();
      const created = await createEmployee(owner.token, {
        ...body,
        role: 'manager',
      });
      expect(created.status).toBe(201);
      expect(created.data.role).toBe('manager');

      const managerToken = (await loginMember(body.email)).data.accessToken;
      const list = await axios.get(
        '/api/members/employees',
        bearer(managerToken),
      );
      expect(list.status).toBe(200);
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
        { name: 'Ana Renomeada', commissionRate: 35.5 },
        bearer(a.token),
      );
      expect(upd.status).toBe(200);
      expect(upd.data).toMatchObject({
        name: 'Ana Renomeada',
        commissionRate: 35.5,
      });

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

    it('employees cannot manage employees or edit their profile', async () => {
      const owner = await asOwner();
      const body = employeeBody();
      await createEmployee(owner.token, body);
      const empToken = (await loginMember(body.email)).data.accessToken;

      const create = await createEmployee(empToken);
      expect(create.status).toBe(403);
      expect(create.data.code).toBe('errors.auth.forbidden');
      expect(
        (await axios.get('/api/members/employees', bearer(empToken))).status,
      ).toBe(403);

      const patchMe = await axios.patch(
        '/api/user/me',
        { name: 'Novo Nome' },
        bearer(empToken),
      );
      expect(patchMe.status).toBe(403);
    });
  });

  it('rejects a bad body with a localized 422 (Accept-Language)', async () => {
    const post = (lang: string) =>
      axios.post(
        '/api/tenants',
        {
          tenant: { name: 'Empresa', slug: `empresa-${uniq()}` },
          owner: {
            name: 'Dono Teste',
            email: `dono-${uniq()}@example.com`,
            phone: '123',
            password: PASSWORD,
          },
        },
        { headers: { 'Accept-Language': lang } },
      );
    const find = (data: { issues: { path: string; message: string }[] }) =>
      data.issues.find((i) => i.path.endsWith('phone'));

    const en = await post('en');
    expect(en.status).toBe(422);
    expect(find(en.data)?.message).toMatch(/11 digits/i);

    const pt = await post('pt-BR');
    expect(find(pt.data)?.message).toMatch(/11 dígitos/i);
  });

  it('login with wrong credentials is a generic 401', async () => {
    const res = await loginMember(`ninguem-${uniq()}@example.com`, 'whatever');
    expect(res.status).toBe(401);
    expect(res.data.code).toBe('errors.auth.invalidCredentials');
  });

  it('GET /user/me without a token is 401', async () => {
    const res = await axios.get('/api/user/me');
    expect(res.status).toBe(401);
    expect(res.data.code).toBe('errors.auth.tokenMissing');
  });
});
