import { z } from 'zod';
import { roleSchema } from '../user/user.schema.js';

/**
 * Access token payload (JWT, 15 min). `iat`/`exp` are set by the signer.
 * Every account is bound to one tenant, so the token always carries
 * `tenantId`. The app decodes it only for quick UI display — never as the
 * source of truth for authorization.
 */
export const accessTokenPayloadSchema = z.object({
  sub: z.uuid(),
  name: z.string(),
  role: roleSchema,
  tenantId: z.uuid(),
  iat: z.number().int().optional(),
  exp: z.number().int().optional(),
});
export type AccessTokenPayload = z.infer<typeof accessTokenPayloadSchema>;

/** Response of the login endpoints. */
export const authTokensSchema = z.object({
  accessToken: z.string(),
  accessTokenExpiresInSeconds: z.number().int(),
});
export type AuthTokens = z.infer<typeof authTokensSchema>;
