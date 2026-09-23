import {
  createParamDecorator,
  ExecutionContext,
  HttpStatus,
} from '@nestjs/common';
import type { AccessTokenPayload } from '@org/contracts';
import { AppException } from '../../common/app.exception';

type RequestWithUser = { user: AccessTokenPayload };

/**
 * Reads the authenticated user that JwtAuthGuard put on `req.user`.
 *   me(@CurrentUser() user: AccessTokenPayload) {}
 *   me(@CurrentUser('sub') userId: string) {}
 * `field` is limited to the claims every role has; use @TenantId() for the
 * tenant, which clients don't carry.
 */
export const CurrentUser = createParamDecorator(
  (field: keyof AccessTokenPayload | undefined, context: ExecutionContext) => {
    const req = context.switchToHttp().getRequest<RequestWithUser>();
    return field ? req.user[field] : req.user;
  },
);

/**
 * The caller's tenant, for owner/employee routes. A client token has no
 * tenant, so it is refused instead of yielding `undefined` into a query.
 */
export const TenantId = createParamDecorator(
  (_: unknown, context: ExecutionContext): string => {
    const { user } = context.switchToHttp().getRequest<RequestWithUser>();
    if (!('tenantId' in user)) {
      throw new AppException('errors.auth.forbidden', HttpStatus.FORBIDDEN);
    }
    return user.tenantId;
  },
);
