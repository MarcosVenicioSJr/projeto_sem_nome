import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AccessTokenPayload } from '@org/contracts';

/**
 * Reads the authenticated user that JwtAuthGuard put on `req.user`.
 *   me(@CurrentUser() user: AccessTokenPayload) {}
 *   me(@CurrentUser('sub') userId: string) {}
 */
export const CurrentUser = createParamDecorator(
  (field: keyof AccessTokenPayload | undefined, context: ExecutionContext) => {
    const req = context
      .switchToHttp()
      .getRequest<{ user: AccessTokenPayload }>();
    return field ? req.user[field] : req.user;
  },
);
