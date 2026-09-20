import { Test, TestingModule } from '@nestjs/testing';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { hash } from 'bcryptjs';
import { AuthService } from './auth.service';
import { ClientsRepository, MembersRepository } from '../database';

const TENANT_ID = '11111111-1111-4111-8111-111111111111';
const ACCOUNT_ID = '22222222-2222-4222-8222-222222222222';

describe('AuthService', () => {
  let service: AuthService;
  let jwt: JwtService;

  const clients = {
    existsByEmail: jest.fn(),
    findByEmail: jest.fn(),
    create: jest.fn(),
  };
  const members = { findByEmail: jest.fn() };

  beforeEach(async () => {
    jest.resetAllMocks();

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: 'test-secret-1234567890',
          signOptions: { expiresIn: '15m' },
        }),
      ],
      providers: [
        AuthService,
        { provide: ClientsRepository, useValue: clients },
        { provide: MembersRepository, useValue: members },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
    jwt = moduleRef.get(JwtService);
  });

  it('registerClient() creates a global client without exposing the hash', async () => {
    clients.existsByEmail.mockResolvedValue(false);
    clients.create.mockImplementation((data) =>
      Promise.resolve({
        id: ACCOUNT_ID,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data,
      }),
    );

    const res = await service.registerClient({
      name: 'Helena Cardoso',
      email: 'helena@gmail.com',
      phone: '11987654321',
      password: 'Abcd1234',
    });

    expect(res).toMatchObject({ role: 'client', email: 'helena@gmail.com' });
    expect(res).not.toHaveProperty('passwordHash');
    expect(res).not.toHaveProperty('tenantId');
  });

  it('registerClient() rejects an email already registered', async () => {
    clients.existsByEmail.mockResolvedValue(true);
    await expect(
      service.registerClient({
        name: 'X Y',
        email: 'x@y.com',
        phone: '11987654321',
        password: 'Abcd1234',
      }),
    ).rejects.toMatchObject({ key: 'errors.auth.emailTaken' });
  });

  it('loginClient() signs a token with no tenant', async () => {
    clients.findByEmail.mockResolvedValue({
      id: ACCOUNT_ID,
      name: 'Helena',
      passwordHash: await hash('Abcd1234', 4),
    });

    const res = await service.loginClient({
      email: 'helena@gmail.com',
      password: 'Abcd1234',
    });

    const payload = await jwt.verifyAsync(res.accessToken);
    expect(payload).toMatchObject({ sub: ACCOUNT_ID, role: 'client' });
    expect(payload).not.toHaveProperty('tenantId');
  });

  it.each(['owner', 'employee'])(
    'loginMember() signs a %s token carrying role and tenantId',
    async (role) => {
      members.findByEmail.mockResolvedValue({
        id: ACCOUNT_ID,
        tenantId: TENANT_ID,
        role,
        name: 'Alguém',
        passwordHash: await hash('Abcd1234', 4),
      });

      const res = await service.loginMember({
        email: 'alguem@clinica.com',
        password: 'Abcd1234',
      });

      expect(await jwt.verifyAsync(res.accessToken)).toMatchObject({
        sub: ACCOUNT_ID,
        role,
        tenantId: TENANT_ID,
      });
    },
  );

  it('login gives a generic error for wrong password or unknown email', async () => {
    clients.findByEmail.mockResolvedValueOnce(null);
    await expect(
      service.loginClient({ email: 'a@b.co', password: 'x' }),
    ).rejects.toMatchObject({ key: 'errors.auth.invalidCredentials' });

    members.findByEmail.mockResolvedValueOnce({
      id: ACCOUNT_ID,
      tenantId: TENANT_ID,
      role: 'owner',
      name: 'A',
      passwordHash: await hash('Abcd1234', 4),
    });
    await expect(
      service.loginMember({ email: 'a@b.co', password: 'wrong' }),
    ).rejects.toMatchObject({ key: 'errors.auth.invalidCredentials' });
  });
});
