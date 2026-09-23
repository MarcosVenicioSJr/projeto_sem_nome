import type { Catalog } from '../types.js';

/** Base locale. Every other catalog is expected to cover the same keys. */
export const en: Catalog = {
  // ── Generic validation (fallbacks derived from Zod issue codes) ──────
  'validation.invalid': 'Invalid value',
  'validation.invalidType': 'Invalid type',
  'validation.required': 'This field is required',
  'validation.field.required': 'This field is required',
  'validation.string.tooShort': 'Must be at least {minimum} characters',
  'validation.string.tooLong': 'Must be at most {maximum} characters',
  'validation.number.tooSmall': 'Must be at least {minimum}',
  'validation.number.tooBig': 'Must be at most {maximum}',
  'validation.array.tooSmall': 'Select at least {minimum}',
  'validation.array.tooBig': 'Select at most {maximum}',
  'validation.format.email': 'Invalid email',
  'validation.format.uuid': 'Invalid identifier',
  'validation.format.datetime': 'Invalid date/time',
  'validation.format.date': 'Invalid date',
  'validation.format.regex': 'Invalid format',
  'validation.notMultipleOf': 'Must be a multiple of {divisor}',
  'validation.unrecognizedKeys': 'Unexpected fields',
  'validation.invalidValue': 'Not an allowed value',
  'validation.invalidUnion': 'Invalid value',

  // ── Field-specific validation ───────────────────────────────────────
  'validation.name.tooShort': 'Enter your name',
  'validation.phone.format': 'Enter a phone with area code (11 digits)',
  'validation.slug.format':
    'Use 3-60 lowercase letters, numbers and single hyphens',
  'validation.password.minLength': 'Use at least 8 characters',
  'validation.password.uppercase': 'Add an uppercase letter',
  'validation.password.lowercase': 'Add a lowercase letter',
  'validation.password.number': 'Add a number',

  // ── Domain errors (API) ────────────────────────────────────────────
  'errors.auth.emailTaken': 'Email already registered',
  'errors.auth.invalidCredentials': 'Invalid email or password',
  'errors.auth.forbidden': "You don't have permission to do this",
  'errors.auth.tokenMissing': 'Missing access token',
  'errors.auth.tokenInvalid': 'Invalid or expired token',
  'errors.tenant.notFound': 'Company not found',
  'errors.tenant.slugTaken': 'Company address already in use',
  'errors.member.notFound': 'Employee not found',
  'errors.user.notFound': 'User not found',
  'errors.internal': 'Something went wrong',
  'errors.validationFailed': 'Validation failed',

  // ── Transactional email ───────────────────────────────────────────
  'email.verification.subject': 'Your confirmation code · Marginália',
  'email.verification.line1': 'Your confirmation code is:',
  'email.verification.line2': 'It expires in 5 minutes.',

  // ── Genre labels ─────────────────────────────────────────────────
  'genre.romance': 'Romance',
  'genre.suspense': 'Suspense',
  'genre.ficcao-brasileira': 'Brazilian fiction',
  'genre.fantasia': 'Fantasy',
  'genre.biografia': 'Biography',
  'genre.classicos': 'Classics',
  'genre.poesia': 'Poetry',
  'genre.nao-ficcao': 'Non-fiction',
  'genre.autoajuda': 'Self-help',
  'genre.terror': 'Horror',
  'genre.policial': 'Crime',
  'genre.quadrinhos': 'Comics',
};
