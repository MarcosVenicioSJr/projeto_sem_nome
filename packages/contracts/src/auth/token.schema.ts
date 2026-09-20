import { z } from 'zod';
import { ROLE } from '../user/user.schema.js';

const baseClaims = {
  sub: z.uuid(),
  name: z.string(),
  iat: z.number().int().optional(),
  exp: z.number().int().optional(),
};

/**
 * Access token payload (JWT, 15 min). `iat`/`exp` are set by the signer.
 * Owners and employees are bound to one tenant, so the token carries
 * `tenantId`; a client is global and carries none (its tenants come from the
 * DB link).
 * The app decodes it only for quick UI display — never as the source of
 * truth for authorization.
 */
export const accessTokenPayloadSchema = z.discriminatedUnion('role', [
  z.object({ ...baseClaims, role: z.literal(ROLE.OWNER), tenantId: z.uuid() }),
  z.object({ ...baseClaims, role: z.literal(ROLE.EMPLOYEE), tenantId: z.uuid() }),
  z.object({ ...baseClaims, role: z.literal(ROLE.CLIENT) }),
]);
export type AccessTokenPayload = z.infer<typeof accessTokenPayloadSchema>;

/** Response of the login endpoints. */
export const authTokensSchema = z.object({
  accessToken: z.string(),
  accessTokenExpiresInSeconds: z.number().int(),
});
export type AuthTokens = z.infer<typeof authTokensSchema>;
