import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { ClientsRepository, MembersRepository } from '../database';

const ID = '22222222-2222-4222-8222-222222222222';
const TENANT_ID = '11111111-1111-4111-8111-111111111111';

describe('UserService', () => {
  let service: UserService;

  const account = {
    id: ID,
    name: 'A B',
    email: 'a@b.co',
    phone: '11987654321',
    passwordHash: 'hash',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const members = { findById: jest.fn(), existsByEmail: jest.fn(), update: jest.fn() };
  const clients = { findById: jest.fn(), existsByEmail: jest.fn(), update: jest.fn() };

  beforeEach(async () => {
    jest.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: MembersRepository, useValue: members },
        { provide: ClientsRepository, useValue: clients },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it.each(['owner', 'employee'] as const)(
    'findMe() reads the members table for a %s token',
    async (role) => {
      members.findById.mockResolvedValue({ ...account, tenantId: TENANT_ID, role });
      const me = await service.findMe({ sub: ID, name: 'A B', role, tenantId: TENANT_ID });
      expect(me).toMatchObject({ role, tenantId: TENANT_ID });
      expect(clients.findById).not.toHaveBeenCalled();
    },
  );

  it('findMe() reads the client table for a client token', async () => {
    clients.findById.mockResolvedValue(account);
    const me = await service.findMe({ sub: ID, name: 'A B', role: 'client' });
    expect(me).toMatchObject({ role: 'client' });
    expect(me).not.toHaveProperty('tenantId');
  });

  it('findMe() is a 404 when the account no longer exists', async () => {
    clients.findById.mockResolvedValue(null);
    await expect(
      service.findMe({ sub: ID, name: 'A B', role: 'client' }),
    ).rejects.toMatchObject({ key: 'errors.user.notFound' });
  });
});
