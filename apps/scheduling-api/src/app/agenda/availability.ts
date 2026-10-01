/**
 * Pure scheduling rules, kept free of Nest/TypeORM so they are easy to test.
 * Times are minutes since the local midnight of the day being computed.
 */
export type Interval = { start: number; end: number };

/** Slots are offered every 15 minutes inside each free interval. */
export const SLOT_STEP_MINUTES = 15;
/** Minimum notice to book. */
export const MIN_LEAD_MINUTES = 60;
/** The client can cancel online until this long before the start. */
export const CANCEL_WINDOW_MINUTES = 120;
/** Max bookings per phone per day (must be back to back, same professional). */
export const MAX_DAILY_BOOKINGS_PER_PHONE = 2;

/** Removes `busy` from every interval of `free`. */
export function subtract(free: Interval[], busy: Interval): Interval[] {
  const out: Interval[] = [];
  for (const f of free) {
    if (busy.end <= f.start || busy.start >= f.end) {
      out.push(f);
      continue;
    }
    if (busy.start > f.start) out.push({ start: f.start, end: busy.start });
    if (busy.end < f.end) out.push({ start: busy.end, end: f.end });
  }
  return out;
}

/** Working hours minus break, time-off windows and existing bookings. */
export function freeIntervals(
  work: { start: number; end: number },
  busy: Interval[],
): Interval[] {
  return busy
    .reduce<Interval[]>(
      (free, b) => subtract(free, b),
      [{ start: work.start, end: work.end }],
    )
    .sort((a, b) => a.start - b.start);
}

/** Every start time that fits `duration` minutes in a free interval. */
export function candidateStarts(free: Interval[], duration: number): number[] {
  const starts: number[] = [];
  for (const f of free) {
    for (let t = f.start; t + duration <= f.end; t += SLOT_STEP_MINUTES) {
      starts.push(t);
    }
  }
  return starts;
}

/** Whether `[start, end)` lies entirely inside one free interval. */
export function fits(free: Interval[], start: number, end: number): boolean {
  return free.some((f) => f.start <= start && end <= f.end);
}

type Booking = { professionalId: string; startAt: Date; endAt: Date };

/**
 * Daily limit per phone: with `existing` non-cancelled bookings that day, a
 * new one is refused when the limit is reached, or when it is not back to
 * back (one starts exactly where the other ends) with the same professional.
 */
export function violatesDailyLimit(
  existing: Booking[],
  next: Booking,
): boolean {
  if (existing.length >= MAX_DAILY_BOOKINGS_PER_PHONE) return true;
  return existing.some(
    (e) =>
      e.professionalId !== next.professionalId ||
      !(
        e.endAt.getTime() === next.startAt.getTime() ||
        next.endAt.getTime() === e.startAt.getTime()
      ),
  );
}
