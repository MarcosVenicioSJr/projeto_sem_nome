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
  'validation.username.pattern':
    "Start with a letter; use only letters, numbers, '.' and '_' (no '..' or trailing '.')",
  'validation.password.minLength': 'Use at least 8 characters',
  'validation.password.uppercase': 'Add an uppercase letter',
  'validation.password.lowercase': 'Add a lowercase letter',
  'validation.password.number': 'Add a number',
  'validation.otp.length': 'Enter the 6-digit code',
  'validation.birthDate.future': "Date can't be in the future",
  'validation.birthDate.minAge': 'You must be at least 18 years old',
  'validation.genres.duplicate': 'Remove duplicate genres',
  'validation.terms.required': 'You must accept the Terms and the Privacy Policy',

  // ── Domain errors (API) ────────────────────────────────────────────
  'errors.auth.usernameTaken': 'Username already in use',
  'errors.auth.emailTaken': 'Email already registered',
  'errors.auth.invalidCredentials': 'Invalid username or password',
  'errors.auth.accountBlocked':
    'Account locked. Use "Forgot my password" to unlock it.',
  'errors.auth.codeInvalidOrExpired': 'Code is incorrect or expired',
  'errors.auth.codeIncorrect': 'Incorrect code. Attempts left: {remaining}',
  'errors.auth.registrationNotFound': 'Registration not found',
  'errors.auth.tokenMissing': 'Missing access token',
  'errors.auth.tokenInvalid': 'Invalid or expired token',
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
