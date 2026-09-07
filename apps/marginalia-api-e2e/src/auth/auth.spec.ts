import axios from 'axios';
import { clearMailpit, getVerificationCode } from '../support/mailpit';

const uniq = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

const validRegister = (username: string) => ({
  name: 'Helena Cardoso',
  username,
  email: `${username}@example.com`,
  password: 'Abcd1234',
  birthDate: '1988-03-14',
});

describe('Auth (e2e)', () => {
  it('register → verify-email → accept-terms → login → GET /user/me', async () => {
    await clearMailpit();
    const username = `e2e_${uniq()}`;
    const email = `${username}@example.com`;

    const reg = await axios.post('/api/auth/register', validRegister(username));
    expect(reg.status).toBe(201);
    expect(reg.data.status).toBe('pending_verification');
    expect(reg.data.email).toBe(`e***@example.com`);
    const { registrationId } = reg.data as { registrationId: string };

    const code = await getVerificationCode(email);
    const verify = await axios.post('/api/auth/verify-email', {
      registrationId,
      code,
    });
    expect(verify.status).toBe(200);
    expect(verify.data.status).toBe('email_verified');

    const terms = await axios.post('/api/auth/accept-terms', {
      registrationId,
      termsVersion: '2026-01-01',
      acceptedTerms: true,
    });
    expect(terms.status).toBe(200);
    expect(terms.data.status).toBe('active');
    expect(terms.data.consents).toEqual({
      recommendations: false,
      marketing: false,
    });

    const login = await axios.post('/api/auth/login', {
      username,
      password: 'Abcd1234',
    });
    expect(login.status).toBe(200);
    expect(typeof login.data.accessToken).toBe('string');

    const me = await axios.get('/api/user/me', {
      headers: { Authorization: `Bearer ${login.data.accessToken}` },
    });
    expect(me.status).toBe(200);
    expect(me.data.username).toBe(username);
    expect(me.data.status).toBe('active');
    expect(me.data.email).toBe(email);
  });

  it('username-available flips to false once taken', async () => {
    const username = `e2e_${uniq()}`;
    const before = await axios.get(`/api/auth/username-available?u=${username}`);
    expect(before.data.available).toBe(true);

    await axios.post('/api/auth/register', validRegister(username));

    const after = await axios.get(`/api/auth/username-available?u=${username}`);
    expect(after.data.available).toBe(false);
  });

  it('rejects a bad body with a localized 422 (Accept-Language)', async () => {
    const en = await axios.post(
      '/api/auth/register',
      { username: 'x' },
      { headers: { 'Accept-Language': 'en' } },
    );
    expect(en.status).toBe(422);
    const enUsername = en.data.issues.find(
      (i: { path: string }) => i.path === 'username',
    );
    expect(enUsername.message).toMatch(/at least/i);

    const pt = await axios.post(
      '/api/auth/register',
      { username: 'x' },
      { headers: { 'Accept-Language': 'pt-BR' } },
    );
    const ptUsername = pt.data.issues.find(
      (i: { path: string }) => i.path === 'username',
    );
    expect(ptUsername.message).toMatch(/ao menos/i);
  });

  it('login with wrong credentials is a generic 401', async () => {
    const res = await axios.post('/api/auth/login', {
      username: `nobody_${uniq()}`,
      password: 'whatever',
    });
    expect(res.status).toBe(401);
    expect(res.data.code).toBe('errors.auth.invalidCredentials');
  });

  it('GET /user/me without a token is 401', async () => {
    const res = await axios.get('/api/user/me');
    expect(res.status).toBe(401);
    expect(res.data.code).toBe('errors.auth.tokenMissing');
  });
});
