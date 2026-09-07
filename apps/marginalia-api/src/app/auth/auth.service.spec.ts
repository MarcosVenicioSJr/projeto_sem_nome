import { Test, TestingModule } from '@nestjs/testing';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import {
  RefreshTokensRepository,
  TermsAcceptancesRepository,
  UsersRepository,
  VerificationCodesRepository,
} from '../database';
import { MailerService } from '../mail';

describe('AuthService', () => {
  let service: AuthService;

  const users = {
    existsByUsername: jest.fn().mockResolvedValue(false),
    existsByEmail: jest.fn().mockResolvedValue(false),
    create: jest.fn().mockResolvedValue({
      id: 'u1',
      name: 'Helena Cardoso',
      email: 'helena@gmail.com',
      passwordHash: 'hash',
      status: 'pending_verification',
      failedLoginAttempts: 0,
    }),
    findByUsername: jest.fn(),
    update: jest.fn().mockResolvedValue(undefined),
  };
  const codes = { issue: jest.fn().mockResolvedValue({}) };
  const refreshTokens = { create: jest.fn().mockResolvedValue({}) };
  const terms = { record: jest.fn().mockResolvedValue({}) };
  const mailer = { sendVerificationCode: jest.fn().mockResolvedValue(undefined) };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: 'test-secret-1234567890',
          signOptions: { expiresIn: '15m' },
        }),
      ],
      providers: [
        AuthService,
        { provide: UsersRepository, useValue: users },
        { provide: VerificationCodesRepository, useValue: codes },
        { provide: RefreshTokensRepository, useValue: refreshTokens },
        { provide: TermsAcceptancesRepository, useValue: terms },
        { provide: MailerService, useValue: mailer },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('register() creates the user and returns a masked email', async () => {
    const res = await service.register({
      name: 'Helena Cardoso',
      username: 'helenacardoso',
      email: 'helena@gmail.com',
      password: 'Abcd1234',
      birthDate: '1988-03-14',
    });

    expect(res.registrationId).toBe('u1');
    expect(res.status).toBe('pending_verification');
    expect(res.email).toBe('h***@gmail.com');
    expect(users.create).toHaveBeenCalledTimes(1);
    expect(codes.issue).toHaveBeenCalledTimes(1);
    expect(mailer.sendVerificationCode).toHaveBeenCalledWith(
      'helena@gmail.com',
      expect.stringMatching(/^\d{6}$/),
    );
  });

  it('register() rejects a taken username with an i18n key', async () => {
    users.existsByUsername.mockResolvedValueOnce(true);
    await expect(
      service.register({
        name: 'X',
        username: 'taken',
        email: 'x@y.com',
        password: 'Abcd1234',
        birthDate: '1988-03-14',
      }),
    ).rejects.toMatchObject({ key: 'errors.auth.usernameTaken' });
  });
});
