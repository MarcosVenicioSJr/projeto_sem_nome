/**
 * The tenant's local time. Working hours are stored as minutes since local
 * midnight and dates as local calendar days, so they must be converted to UTC
 * instants for comparison with `timestamptz` columns.
 *
 * Fixed at UTC-3 (Brasília, no daylight saving since 2019). Per-tenant time
 * zones would replace this constant with a value read from the tenant.
 */
export const TENANT_UTC_OFFSET_MINUTES = -180;
const MS_PER_MINUTE = 60_000;

/** The UTC instant of `minute` (since local 00:00) on the local day `date` (`YYYY-MM-DD`). */
export function localMinuteToDate(date: string, minute: number): Date {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(
    Date.UTC(y, m - 1, d, 0, minute) -
      TENANT_UTC_OFFSET_MINUTES * MS_PER_MINUTE,
  );
}

/** `[from, to)` UTC range of a local day. */
export function dayRange(date: string): { from: Date; to: Date } {
  return {
    from: localMinuteToDate(date, 0),
    to: localMinuteToDate(date, 1440),
  };
}

/** `[from, to)` UTC range of a local month (`YYYY-MM`). */
export function monthRange(month: string): { from: Date; to: Date } {
  const [y, m] = month.split('-').map(Number);
  const next = new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 10);
  return {
    from: localMinuteToDate(`${month}-01`, 0),
    to: localMinuteToDate(next, 0),
  };
}

/** Weekday (0 = Sunday) of a local calendar day. */
export function weekdayOf(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** The local calendar day (`YYYY-MM-DD`) an instant falls on. */
export function localDateOf(instant: Date): string {
  return new Date(instant.getTime() + TENANT_UTC_OFFSET_MINUTES * MS_PER_MINUTE)
    .toISOString()
    .slice(0, 10);
}
