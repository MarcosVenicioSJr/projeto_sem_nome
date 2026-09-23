import { HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import {
  ROLE,
  type AccessTokenPayload,
  type AuthTokens,
  type LoginInput,
  type RegisterInput,
} from '@org/contracts';
import { AppException } from '../common/app.exception';
import { ClientsRepository, MembersRepository } from '../database';
import { toClient } from '../user/user.mapper';
import { ACCESS_TOKEN_TTL, ACCESS_TOKEN_TTL_SECONDS } from './jwt';

const BCRYPT_ROUNDS = 12; // spec §4.2 (10–12)

@Injectable()
export class AuthService {
  constructor(
    private readonly clients: ClientsRepository,
    private readonly members: MembersRepository,
    private readonly jwt: JwtService,
  ) {}

  /** Client signup. Global account; linking to a tenant happens on booking. */
  async registerClient(input: RegisterInput) {
    if (await this.clients.existsByEmail(input.email)) {
      throw new AppException('errors.auth.emailTaken', HttpStatus.CONFLICT);
    }
    const client = await this.clients.create({
      name: input.name,
      email: input.email,
      phone: input.phone,
      passwordHash: await hash(input.password, BCRYPT_ROUNDS),
    });
    return toClient(client);
  }

  /** Client sign in — email + password. Generic error. */
  async loginClient(input: LoginInput): Promise<AuthTokens> {
    const client = await this.clients.findByEmail(input.email);
    if (!client || !(await compare(input.password, client.passwordHash))) {
      throw this.invalidCredentials();
    }
    return this.issueTokens({
      sub: client.id,
      name: client.name,
      role: ROLE.CLIENT,
    });
  }

  /** Owner or employee sign in — email + password. Generic error. */
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
