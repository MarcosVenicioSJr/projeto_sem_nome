import { Test, TestingModule } from '@nestjs/testing';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { hash } from 'bcryptjs';
import { AuthService } from './auth.service';
import { MembersRepository } from '../database';

const TENANT_ID = '11111111-1111-4111-8111-111111111111';
const ACCOUNT_ID = '22222222-2222-4222-8222-222222222222';

describe('AuthService', () => {
  let service: AuthService;
  let jwt: JwtService;

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
        { provide: MembersRepository, useValue: members },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
    jwt = moduleRef.get(JwtService);
  });

  it.each(['owner', 'manager', 'employee'])(
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
        email: 'alguem@empresa.com',
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
    members.findByEmail.mockResolvedValueOnce(null);
    await expect(
      service.loginMember({ email: 'a@b.co', password: 'x' }),
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
