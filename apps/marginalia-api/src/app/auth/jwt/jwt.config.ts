/**
 * Session parameters (Security spec §6). Fixed by the spec — not env vars.
 * The signing secret comes from ConfigService (JWT_SECRET), injected into
 * JwtModule.registerAsync in auth.module.ts.
 */
export const ACCESS_TOKEN_TTL = '15m';
export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
export const REFRESH_TOKEN_TTL = '5h';
export const REFRESH_TOKEN_TTL_SECONDS = 5 * 60 * 60;
