import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { accessTokenPayloadSchema, type AccessTokenPayload } from '@org/contracts';
import { AppException } from '../../common/app.exception';

interface RequestLike {
  headers: Record<string, string | string[] | undefined>;
  user?: AccessTokenPayload;
}

/**
 * Authentication (spec §7): validates the access token's SIGNATURE and expiry
 * and attaches the payload to `req.user`. It does NOT do sensitive
 * authorization — that revalidates against the DB on every request, in each
 * resource's service.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<RequestLike>();
    const header = req.headers['authorization'];
    const token =
      typeof header === 'string' && header.startsWith('Bearer ')
        ? header.slice('Bearer '.length)
        : null;

    if (!token) {
      throw new AppException('errors.auth.tokenMissing', HttpStatus.UNAUTHORIZED);
    }

    try {
      const raw = await this.jwt.verifyAsync<Record<string, unknown>>(token);
      req.user = accessTokenPayloadSchema.parse(raw);
      return true;
    } catch {
      throw new AppException('errors.auth.tokenInvalid', HttpStatus.UNAUTHORIZED);
    }
  }
}
