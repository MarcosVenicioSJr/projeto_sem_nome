import { createHash, randomInt } from 'node:crypto';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import type {
  AccessTokenPayload,
  AcceptTermsInput,
  AuthTokens,
  LoginInput,
  RegisterInput,
  ResendCodeInput,
  VerifyEmailInput,
} from '@org/contracts';
import { OTP_LENGTH } from '@org/contracts';
import { maskEmail } from '@org/utils';
import { AppException } from '../common/app.exception';
import {
  RefreshTokensRepository,
  TermsAcceptancesRepository,
  UsersRepository,
  VerificationCodesRepository,
} from '../database';
import { MailerService } from '../mail';
import {
  ACCESS_TOKEN_TTL,
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_TTL,
  REFRESH_TOKEN_TTL_SECONDS,
} from './jwt';

const BCRYPT_ROUNDS = 12; // spec §4.2 (10–12)
const OTP_TTL_MS = 5 * 60 * 1000; // spec §3
const OTP_MAX_ATTEMPTS = 3; // spec §3
const RESEND_COOLDOWN_SECONDS = 2 * 60; // spec §3
const MAX_FAILED_LOGINS = 3; // spec §4.3

const sha256 = (value: string) =>
  createHash('sha256').update(value).digest('hex');

/**
 * Signup and login (Security spec §2–4) on top of the repository layer.
 * Open TODO: a real 2-minute cooldown for the resend endpoint.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwt: JwtService,
    private readonly users: UsersRepository,
    private readonly codes: VerificationCodesRepository,
    private readonly refreshTokens: RefreshTokensRepository,
    private readonly terms: TermsAcceptancesRepository,
    private readonly mailer: MailerService,
  ) {}

  /** Step 1 — create the account as `pending_verification` and send the code. */
  async register(input: RegisterInput) {
    if (await this.users.existsByUsername(input.username)) {
      throw new AppException('errors.auth.usernameTaken', HttpStatus.CONFLICT);
    }
    if (await this.users.existsByEmail(input.email)) {
      throw new AppException('errors.auth.emailTaken', HttpStatus.CONFLICT);
    }

    const user = await this.users.create({
      name: input.name,
      username: input.username,
      email: input.email,
      birthDate: input.birthDate,
      passwordHash: await hash(input.password, BCRYPT_ROUNDS),
      status: 'pending_verification',
    });

    await this.issueCode(user.id, user.email);

    return {
      registrationId: user.id,
      status: 'pending_verification' as const,
      email: maskEmail(user.email),
      codeLength: OTP_LENGTH,
      codeExpiresInSeconds: OTP_TTL_MS / 1000,
      resendCooldownSeconds: RESEND_COOLDOWN_SECONDS,
    };
  }

  /** Real-time username availability (spec §2.2). */
  async checkUsernameAvailability(username: string) {
    return {
      username,
      available: !(await this.users.existsByUsername(username)),
    };
  }

  /** Step 2 — validate the 6-digit code. */
  async verifyEmail(input: VerifyEmailInput) {
    const code = await this.codes.activeFor(
      input.registrationId,
      'registration',
    );
    if (!code) {
      throw new AppException(
        'errors.auth.codeInvalidOrExpired',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (code.expiresAt.getTime() < Date.now()) {
      await this.codes.consume(code.id);
      throw new AppException(
        'errors.auth.codeInvalidOrExpired',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (code.codeHash !== sha256(input.code)) {
      const attempts = code.attemptsCount + 1;
      await this.codes.registerAttempt(code.id, attempts);
      if (attempts >= OTP_MAX_ATTEMPTS) await this.codes.consume(code.id);
      throw new AppException(
        'errors.auth.codeIncorrect',
        HttpStatus.UNAUTHORIZED,
        { remaining: Math.max(OTP_MAX_ATTEMPTS - attempts, 0) },
      );
    }

    await this.codes.consume(code.id);
    await this.users.update(input.registrationId, {
      emailVerifiedAt: new Date(),
    });
    return { status: 'email_verified' as const };
  }

  /** Step 2 — "Resend" the code. */
  async resendCode(input: ResendCodeInput) {
    // TODO: enforce the 2-minute per-user cooldown before re-issuing.
    const user = await this.users.findById(input.registrationId);
    if (!user) {
      throw new AppException(
        'errors.auth.registrationNotFound',
        HttpStatus.NOT_FOUND,
      );
    }
    await this.issueCode(user.id, user.email);
    return { resent: true, resendCooldownSeconds: RESEND_COOLDOWN_SECONDS };
  }

  /** Step 3 — accept Terms + LGPD consents → account unlocked. */
  async acceptTerms(input: AcceptTermsInput) {
    await this.terms.record({
      userId: input.registrationId,
      termsVersion: input.termsVersion,
      consentRecommendations: input.consentRecommendations,
      consentMarketing: input.consentMarketing,
    });
    await this.users.update(input.registrationId, { status: 'active' });

    return {
      status: 'active' as const,
      termsVersion: input.termsVersion,
      consents: {
        recommendations: input.consentRecommendations,
        marketing: input.consentMarketing,
      },
    };
  }

  /** "Sign in" — username + password (spec §4). Generic error; lock at 3. */
  async login(input: LoginInput): Promise<AuthTokens> {
    const user = await this.users.findByUsername(input.username);
    if (!user) {
      throw new AppException(
        'errors.auth.invalidCredentials',
        HttpStatus.UNAUTHORIZED,
      );
    }
    if (user.status === 'blocked') {
      throw new AppException(
        'errors.auth.accountBlocked',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (!(await compare(input.password, user.passwordHash))) {
      const failed = user.failedLoginAttempts + 1;
      await this.users.update(user.id, {
        failedLoginAttempts: failed,
        ...(failed >= MAX_FAILED_LOGINS
          ? { status: 'blocked' as const }
          : {}),
      });
      throw new AppException(
        'errors.auth.invalidCredentials',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (user.failedLoginAttempts > 0) {
      await this.users.update(user.id, { failedLoginAttempts: 0 });
    }

    const payload: AccessTokenPayload = {
      sub: user.id,
      name: user.name,
      clubs: [], // TODO(orm): the user's real clubs + roles
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, { expiresIn: ACCESS_TOKEN_TTL }),
      this.jwt.signAsync(
        { sub: user.id, typ: 'refresh' },
        { expiresIn: REFRESH_TOKEN_TTL },
      ),
    ]);

    await this.refreshTokens.create({
      userId: user.id,
      tokenHash: sha256(refreshToken),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000),
    });

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresInSeconds: ACCESS_TOKEN_TTL_SECONDS,
    };
  }

  /** Generate a 6-digit code (spec §3: crypto, SHA-256 hash, 1 active at a time). */
  private async issueCode(userId: string, email: string): Promise<void> {
    const code = String(randomInt(0, 10 ** OTP_LENGTH)).padStart(
      OTP_LENGTH,
      '0',
    );
    await this.codes.issue({
      userId,
      codeHash: sha256(code),
      purpose: 'registration',
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    });
    try {
      await this.mailer.sendVerificationCode(email, code);
    } catch (err) {
      // Don't fail signup if SMTP is down — there is a "resend".
      this.logger.warn(
        `Failed to send the code to ${maskEmail(email)}: ${
          (err as Error).message
        }`,
      );
    }
  }
}
