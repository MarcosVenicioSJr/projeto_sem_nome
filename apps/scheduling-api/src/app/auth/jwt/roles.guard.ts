import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AccessTokenPayload, Role } from '@org/contracts';
import { AppException } from '../../common/app.exception';
import { ROLES_KEY } from './roles.decorator';

/**
 * Authorization by role. Must run after JwtAuthGuard (needs `req.user`).
 * No @Roles() on the route means any authenticated role is allowed.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required?.length) return true;

    const { user } = context
      .switchToHttp()
      .getRequest<{ user?: AccessTokenPayload }>();
    if (!user || !required.includes(user.role)) {
      throw new AppException('errors.auth.forbidden', HttpStatus.FORBIDDEN);
    }
    return true;
  }
}
