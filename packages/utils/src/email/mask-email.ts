/**
 * Masks an email for display — `helena@gmail.com` → `h***@gmail.com`
 * (Security spec §5). Pure: used by the API (register / reset response)
 * and by the confirmation screens (web and mobile).
 */
export function maskEmail(email: string): string {
  const at = email.lastIndexOf('@');
  if (at <= 0) return email;
  return `${email.slice(0, 1)}***${email.slice(at)}`;
}
