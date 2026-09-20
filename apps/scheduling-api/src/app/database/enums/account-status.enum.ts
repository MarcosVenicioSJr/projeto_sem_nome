/**
 * Account lifecycle (Security spec §8, ADR-010). Local to the persistence
 * layer so entities stay contract-free; drift against `accountStatusSchema`
 * in @org/contracts is caught at compile time in `user.mapper.ts`.
 */
export const ACCOUNT_STATUS = [
  'pending_verification',
  'active',
  'blocked',
] as const;

export type AccountStatus = (typeof ACCOUNT_STATUS)[number];
