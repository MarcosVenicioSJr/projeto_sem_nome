import {
  candidateStarts,
  fits,
  freeIntervals,
  subtract,
  violatesDailyLimit,
} from './availability';

const at = (h: number, m = 0) => new Date(Date.UTC(2026, 8, 28, h, m));
const P1 = 'prof-1';
const P2 = 'prof-2';

describe('availability', () => {
  it('subtracts a busy window from a free interval', () => {
    expect(
      subtract([{ start: 540, end: 720 }], { start: 600, end: 630 }),
    ).toEqual([
      { start: 540, end: 600 },
      { start: 630, end: 720 },
    ]);
    expect(
      subtract([{ start: 540, end: 720 }], { start: 0, end: 1440 }),
    ).toEqual([]);
    expect(
      subtract([{ start: 540, end: 720 }], { start: 800, end: 900 }),
    ).toEqual([{ start: 540, end: 720 }]);
  });

  it('computes free time as hours minus break, time-off and bookings', () => {
    const free = freeIntervals({ start: 540, end: 1080 }, [
      { start: 720, end: 780 }, // lunch
      { start: 900, end: 960 }, // booking
    ]);
    expect(free).toEqual([
      { start: 540, end: 720 },
      { start: 780, end: 900 },
      { start: 960, end: 1080 },
    ]);
  });

  it('offers start times every 15 min that fit the duration', () => {
    expect(candidateStarts([{ start: 540, end: 600 }], 30)).toEqual([
      540, 555, 570,
    ]);
    expect(candidateStarts([{ start: 540, end: 560 }], 30)).toEqual([]);
  });

  it('checks that a booking fits inside one free interval', () => {
    const free = [
      { start: 540, end: 720 },
      { start: 780, end: 900 },
    ];
    expect(fits(free, 690, 720)).toBe(true);
    expect(fits(free, 700, 740)).toBe(false);
  });

  describe('daily limit per phone', () => {
    const first = { professionalId: P1, startAt: at(9), endAt: at(9, 40) };

    it('allows the first booking of the day', () => {
      expect(violatesDailyLimit([], first)).toBe(false);
    });

    it('allows a second booking back to back with the same professional', () => {
      const after = {
        professionalId: P1,
        startAt: at(9, 40),
        endAt: at(10, 10),
      };
      const before = { professionalId: P1, startAt: at(8, 30), endAt: at(9) };
      expect(violatesDailyLimit([first], after)).toBe(false);
      expect(violatesDailyLimit([first], before)).toBe(false);
    });

    it('refuses a second booking that is not sequential', () => {
      const later = { professionalId: P1, startAt: at(15), endAt: at(15, 30) };
      expect(violatesDailyLimit([first], later)).toBe(true);
    });

    it('refuses a sequential booking with another professional', () => {
      const other = {
        professionalId: P2,
        startAt: at(9, 40),
        endAt: at(10, 10),
      };
      expect(violatesDailyLimit([first], other)).toBe(true);
    });

    it('always refuses a third booking', () => {
      const second = {
        professionalId: P1,
        startAt: at(9, 40),
        endAt: at(10, 10),
      };
      const third = {
        professionalId: P1,
        startAt: at(10, 10),
        endAt: at(10, 40),
      };
      expect(violatesDailyLimit([first, second], third)).toBe(true);
    });
  });
});
