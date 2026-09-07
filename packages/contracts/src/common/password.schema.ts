import { z } from 'zod';

export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 72; // bcrypt/argon2 input limit

/**
 * The SAME rules the strength meter renders on step 1
 * ("✓ 8 characters  ✓ uppercase  ✓ lowercase  · number").
 * The app maps `passwordRules` to the checks; the schema below is derived
 * from the same list, so UI and validation never drift.
 * `label` is an i18n key.
 */
export const passwordRules = [
  {
    id: 'length',
    label: 'validation.password.minLength',
    test: (v: string) => v.length >= PASSWORD_MIN,
  },
  {
    id: 'uppercase',
    label: 'validation.password.uppercase',
    test: (v: string) => /\p{Lu}/u.test(v),
  },
  {
    id: 'lowercase',
    label: 'validation.password.lowercase',
    test: (v: string) => /\p{Ll}/u.test(v),
  },
  {
    id: 'number',
    label: 'validation.password.number',
    test: (v: string) => /\d/.test(v),
  },
] as const;

export type PasswordRuleId = (typeof passwordRules)[number]['id'];

export const passwordSchema = passwordRules.reduce<z.ZodType<string>>(
  (schema, rule) => schema.refine(rule.test, { message: rule.label }),
  z.string().max(PASSWORD_MAX, 'validation.string.tooLong'),
);

export type Password = z.infer<typeof passwordSchema>;
