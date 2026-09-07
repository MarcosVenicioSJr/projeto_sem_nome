import { z } from 'zod';

/**
 * Session structure (Security spec §6).
 * The app decodes the access token only for quick UI display (name, club
 * list and role) — never as the source of truth for authorization.
 */

/** Role within a club (spec §6.1). */
export const CLUB_ROLE = { FOUNDER: 1, CO_FOUNDER: 2, MEMBER: 3 } as const;
export const clubRoleSchema = z.literal([1, 2, 3]);
export type ClubRole = z.infer<typeof clubRoleSchema>;

export const clubMembershipSchema = z.object({
  id: z.uuid(),
  role: clubRoleSchema,
});
export type ClubMembership = z.infer<typeof clubMembershipSchema>;

/** Access token payload (JWT, 15 min). `iat`/`exp` are set by the signer. */
export const accessTokenPayloadSchema = z.object({
  sub: z.uuid(),
  name: z.string(),
  clubs: z.array(clubMembershipSchema),
  iat: z.number().int().optional(),
  exp: z.number().int().optional(),
});
export type AccessTokenPayload = z.infer<typeof accessTokenPayloadSchema>;

/** Response of POST /auth/login and of the refresh call. */
export const authTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  accessTokenExpiresInSeconds: z.number().int(),
});
export type AuthTokens = z.infer<typeof authTokensSchema>;
