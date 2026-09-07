import { HttpException } from '@nestjs/common';
import type { TranslateParams } from '@org/i18n';

/**
 * Domain error carrying an i18n key (+ params) instead of a fixed message.
 * `AllExceptionsFilter` localizes it per the request's Accept-Language.
 *
 *   throw new AppException('errors.auth.usernameTaken', 409);
 *   throw new AppException('errors.auth.codeIncorrect', 401, { remaining: 2 });
 */
export class AppException extends HttpException {
  constructor(
    readonly key: string,
    status: number,
    readonly params?: TranslateParams,
  ) {
    super(key, status);
  }
}
