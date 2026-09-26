import { HttpStatus } from '@nestjs/common';
import type { AccessTokenPayload } from '@org/contracts';
import { AppException } from './app.exception';

/** Owners and managers run the tenant; employees only act on their own data. */
export const isManagement = (caller: AccessTokenPayload): boolean =>
  caller.role === 'owner' || caller.role === 'manager';

/** Throws 403 unless the caller manages the tenant or `professionalId` is the caller. */
export function assertManagerOrSelf(
  caller: AccessTokenPayload,
  professionalId: string,
): void {
  if (!isManagement(caller) && caller.sub !== professionalId) {
    throw new AppException('errors.auth.forbidden', HttpStatus.FORBIDDEN);
  }
}
