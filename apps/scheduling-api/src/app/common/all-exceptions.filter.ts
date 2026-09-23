import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ZodError } from 'zod';
import { parseAcceptLanguage, t, translateZodError } from '@org/i18n';
import { AppException } from './app.exception';

interface RequestLike {
  headers?: Record<string, string | string[] | undefined>;
}

/**
 * Single place where errors become HTTP responses. Localizes everything to
 * the request's Accept-Language:
 *  - ZodError      -> 422 with translated field issues
 *  - AppException  -> its status, translated message + machine `code`
 *  - HttpException -> passed through
 *  - anything else -> 500 (logged)
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<RequestLike>();
    const acceptLanguage = req.headers?.['accept-language'];
    const locale = parseAcceptLanguage(
      Array.isArray(acceptLanguage) ? acceptLanguage[0] : acceptLanguage,
    );
    const res = ctx.getResponse();

    if (exception instanceof ZodError) {
      httpAdapter.reply(
        res,
        {
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          error: t('errors.validationFailed', locale),
          issues: translateZodError(exception, locale),
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
      return;
    }

    if (exception instanceof AppException) {
      const status = exception.getStatus();
      httpAdapter.reply(
        res,
        {
          statusCode: status,
          code: exception.key,
          message: t(exception.key, locale, exception.params),
        },
        status,
      );
      return;
    }

    if (exception instanceof HttpException) {
      httpAdapter.reply(res, exception.getResponse(), exception.getStatus());
      return;
    }

    this.logger.error(exception);
    httpAdapter.reply(
      res,
      {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: t('errors.internal', locale),
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
