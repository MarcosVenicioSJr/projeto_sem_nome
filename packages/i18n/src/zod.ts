import { t, type TranslateParams } from './translate.js';
import type { Locale } from './types.js';

/**
 * Structural shape of a Zod issue — kept local so `@org/i18n` doesn't depend
 * on `zod`. A real `ZodError` is assignable to `ZodLikeError`.
 */
export interface ZodLikeIssue {
  code: string;
  path: PropertyKey[];
  message?: string;
  input?: unknown;
  origin?: string;
  minimum?: number | bigint;
  maximum?: number | bigint;
  divisor?: number;
  format?: string;
  params?: Record<string, string | number>;
}

export interface ZodLikeError {
  issues: ZodLikeIssue[];
}

export interface TranslatedIssue {
  /** Dotted field path, e.g. `favoriteGenres.1`. Empty for the root. */
  path: string;
  message: string;
  code: string;
}

const KEY_RE = /^[a-z][a-zA-Z0-9]*(?:\.[a-zA-Z0-9-]+)+$/;

/** A custom message that is itself a dotted key is used verbatim. */
function resolveKey(issue: ZodLikeIssue): string {
  if (typeof issue.message === 'string' && KEY_RE.test(issue.message)) {
    return issue.message;
  }

  switch (issue.code) {
    case 'invalid_type':
      return issue.input === undefined
        ? 'validation.required'
        : 'validation.invalidType';
    case 'too_small':
      return issue.origin === 'number' || issue.origin === 'bigint'
        ? 'validation.number.tooSmall'
        : issue.origin === 'array' || issue.origin === 'set'
          ? 'validation.array.tooSmall'
          : 'validation.string.tooShort';
    case 'too_big':
      return issue.origin === 'number' || issue.origin === 'bigint'
        ? 'validation.number.tooBig'
        : issue.origin === 'array' || issue.origin === 'set'
          ? 'validation.array.tooBig'
          : 'validation.string.tooLong';
    case 'invalid_format':
      return `validation.format.${issue.format ?? 'regex'}`;
    case 'not_multiple_of':
      return 'validation.notMultipleOf';
    case 'unrecognized_keys':
      return 'validation.unrecognizedKeys';
    case 'invalid_value':
      return 'validation.invalidValue';
    case 'invalid_union':
      return 'validation.invalidUnion';
    default:
      return 'validation.invalid';
  }
}

function issueParams(issue: ZodLikeIssue): TranslateParams {
  const params: TranslateParams = {};
  if (issue.minimum !== undefined) params.minimum = Number(issue.minimum);
  if (issue.maximum !== undefined) params.maximum = Number(issue.maximum);
  if (issue.divisor !== undefined) params.divisor = issue.divisor;
  return { ...params, ...(issue.params ?? {}) };
}

/** Turns a ZodError into `{ path, message, code }[]` localized to `locale`. */
export function translateZodError(
  error: ZodLikeError,
  locale?: Locale,
): TranslatedIssue[] {
  return error.issues.map((issue) => ({
    path: issue.path.map(String).join('.'),
    code: issue.code,
    message: t(resolveKey(issue), locale, issueParams(issue)),
  }));
}
