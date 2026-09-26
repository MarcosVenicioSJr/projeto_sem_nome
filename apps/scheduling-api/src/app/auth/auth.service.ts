import { HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';
import {
  type AccessTokenPayload,
  type AuthTokens,
  type LoginInput,
} from '@org/contracts';
import { AppException } from '../common/app.exception';
import { MembersRepository } from '../database';
import { ACCESS_TOKEN_TTL, ACCESS_TOKEN_TTL_SECONDS } from './jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly members: MembersRepository,
    private readonly jwt: JwtService,
  ) {}

  /** Owner, manager or employee sign in — email + password. Generic error. */
  async loginMember(input: LoginInput): Promise<AuthTokens> {
    const member = await this.members.findByEmail(input.email);
    if (!member || !(await compare(input.password, member.passwordHash))) {
      throw this.invalidCredentials();
    }
    return this.issueTokens({
      sub: member.id,
      name: member.name,
      role: member.role,
      tenantId: member.tenantId,
    });
  }

  private async issueTokens(payload: AccessTokenPayload): Promise<AuthTokens> {
    return {
      accessToken: await this.jwt.signAsync(payload, {
        expiresIn: ACCESS_TOKEN_TTL,
      }),
      accessTokenExpiresInSeconds: ACCESS_TOKEN_TTL_SECONDS,
    };
  }

  private invalidCredentials(): AppException {
    return new AppException(
      'errors.auth.invalidCredentials',
      HttpStatus.UNAUTHORIZED,
    );
  }
}
