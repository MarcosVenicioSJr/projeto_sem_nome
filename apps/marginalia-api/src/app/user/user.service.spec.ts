import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { UsersRepository } from '../database';

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: UsersRepository, useValue: { findById: jest.fn(), update: jest.fn() } },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
