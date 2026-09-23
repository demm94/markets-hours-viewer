import { describe, it, expect } from 'vitest';
import { DateTime } from 'luxon';
import {
  CHILE_TZ,
  projectMarketToTimeline,
  evaluateMarketAt,
  formatMinutes,
  getSantiagoOffsetDescription,
  isWeekend,
  minuteOffsetToDateTime,
  dateTimeToWallClockMinutes,
  formatMinutesCountdown
} from './timezone';
import { MARKETS } from './markets';

describe('timezone engine', () => {
  const nyse = MARKETS.find((m) => m.id === 'nyse')!;
  const twse = MARKETS.find((m) => m.id === 'twse')!;
  const sse = MARKETS.find((m) => m.id === 'sse')!;

  it('projects NYSE regular session accurately during Chile DST (September 2026)', () => {
    // September 15, 2026: Chile is in UTC-3, NY is in EDT (UTC-4)
    const refDate = DateTime.fromISO('2026-09-15T12:00:00', { zone: CHILE_TZ });
    const segments = projectMarketToTimeline(nyse, refDate);

    expect(segments.length).toBe(1);
    const seg = segments[0];

    // NY 09:30 EDT -> Chile 10:30 (630 min)
    // NY 16:00 EDT -> Chile 17:00 (1020 min)
    expect(seg.startMinute).toBe(630);
    expect(seg.endMinute).toBe(1020);
    expect(seg.type).toBe('regular');
  });

  it('projects Asian market (TWSE) wrapping around the 24h midnight boundary', () => {
    // September 15, 2026: Chile UTC-3, Taipei UTC+8 (11h difference)
    const refDate = DateTime.fromISO('2026-09-15T12:00:00', { zone: CHILE_TZ });
    const segments = projectMarketToTimeline(twse, refDate);

    // Should produce 2 segments within the 24h Chile day:
    // 1) 00:00 to 02:30 (from current day's Taipei session: 09:00 - 13:30 Taipei)
    // 2) 22:00 to 24:00 (from next day's Taipei session: 09:00 - 13:30 Taipei)
    expect(segments.length).toBe(2);

    expect(segments[0].startMinute).toBe(0);
    expect(segments[0].endMinute).toBe(150); // 02:30 = 2 * 60 + 30 = 150

    expect(segments[1].startMinute).toBe(1320); // 22:00 = 22 * 60 = 1320
    expect(segments[1].endMinute).toBe(1440); // 24:00 = 1440
  });

  it('correctly maps China SSE split sessions including lunch break', () => {
    const refDate = DateTime.fromISO('2026-09-15T12:00:00', { zone: CHILE_TZ });
    const segments = projectMarketToTimeline(sse, refDate);

    // China has morning (09:30-11:30), lunch (11:30-13:00), and afternoon (13:00-15:00)
    // In Chile (11h diff in Sep):
    // Taipei/Shanghai 09:30-15:00 spans 22:30 to 04:00 Chile time
    const lunchSegments = segments.filter((s) => s.type === 'lunch');
    const regularSegments = segments.filter((s) => s.type === 'regular');

    expect(lunchSegments.length).toBeGreaterThan(0);
    expect(regularSegments.length).toBeGreaterThan(0);
  });

  it('evaluates instantaneous market status accurately', () => {
    // 14:00 in New York -> NYSE should be open
    const nyOpenInstant = DateTime.fromObject(
      { year: 2026, month: 9, day: 15, hour: 14, minute: 0 },
      { zone: 'America/New_York' }
    );
    const evalNy = evaluateMarketAt(nyse, nyOpenInstant);
    expect(evalNy.status).toBe('open');
    expect(evalNy.localTimeFormatted).toBe('14:00');

    // 20:00 in New York -> NYSE closed
    const nyClosedInstant = DateTime.fromObject(
      { year: 2026, month: 9, day: 15, hour: 20, minute: 0 },
      { zone: 'America/New_York' }
    );
    const evalNyClosed = evaluateMarketAt(nyse, nyClosedInstant);
    expect(evalNyClosed.status).toBe('closed');

    // 12:00 in Shanghai -> lunch break
    const sseLunchInstant = DateTime.fromObject(
      { year: 2026, month: 9, day: 15, hour: 12, minute: 0 },
      { zone: 'Asia/Shanghai' }
    );
    const evalSseLunch = evaluateMarketAt(sse, sseLunchInstant);
    expect(evalSseLunch.status).toBe('lunch');
  });

  it('formats minute offsets correctly', () => {
    expect(formatMinutes(0)).toBe('00:00');
    expect(formatMinutes(630)).toBe('10:30');
    expect(formatMinutes(1020)).toBe('17:00');
    expect(formatMinutes(1440)).toBe('00:00');
  });

  it('detects Santiago DST offset accurately in September', () => {
    const sepDate = DateTime.fromISO('2026-09-15T12:00:00', { zone: CHILE_TZ });
    const desc = getSantiagoOffsetDescription(sepDate);
    expect(desc).toContain('UTC-3');
    expect(desc).toContain('Horario de Verano');
  });

  it('marks markets closed on weekends and displays "Fin de semana"', () => {
    // Saturday, September 19, 2026 at 11:00 AM EDT (regular trading hours on weekdays)
    const saturdayNy = DateTime.fromObject(
      { year: 2026, month: 9, day: 19, hour: 11, minute: 0 },
      { zone: 'America/New_York' }
    );

    const evalWeekend = evaluateMarketAt(nyse, saturdayNy);
    expect(evalWeekend.status).toBe('closed');
    expect(evalWeekend.activeSegmentLabel).toBe('Fin de semana');

    // With isSimulation: true (used by the scrubber to explore typical session hours)
    const evalSimulated = evaluateMarketAt(nyse, saturdayNy, { isSimulation: true });
    expect(evalSimulated.status).toBe('open');
  });

  it('identifies weekend days accurately via isWeekend', () => {
    // Friday
    const friday = DateTime.fromISO('2026-09-18T12:00:00');
    expect(isWeekend(friday)).toBe(false);

    // Saturday
    const saturday = DateTime.fromISO('2026-09-19T12:00:00');
    expect(isWeekend(saturday)).toBe(true);

    // Sunday
    const sunday = DateTime.fromISO('2026-09-20T12:00:00');
    expect(isWeekend(sunday)).toBe(true);

    // Monday
    const monday = DateTime.fromISO('2026-09-21T12:00:00');
    expect(isWeekend(monday)).toBe(false);
  });

  it('preserves wall-clock hour alignment during Chile DST transition days (23h and 25h days)', () => {
    // September 6, 2026: Chile spring-forward transition (23-hour day)
    const springTransitionDate = DateTime.fromISO('2026-09-06T12:00:00', { zone: CHILE_TZ });
    
    // Minute 720 (12:00) should produce a DateTime with hour 12, not 13
    const dtNoon = minuteOffsetToDateTime(720, springTransitionDate);
    expect(dtNoon.hour).toBe(12);
    expect(dtNoon.minute).toBe(0);

    // Minute 630 (10:30) should produce a DateTime with hour 10, minute 30
    const dt1030 = minuteOffsetToDateTime(630, springTransitionDate);
    expect(dt1030.hour).toBe(10);
    expect(dt1030.minute).toBe(30);

    // DateTime at 10:30 converted to wall clock minutes should equal 630
    const wallClockMin = dateTimeToWallClockMinutes(dt1030, springTransitionDate);
    expect(wallClockMin).toBe(630);

    // April 4, 2027: Chile fall-back transition (25-hour day)
    const fallTransitionDate = DateTime.fromISO('2027-04-04T12:00:00', { zone: CHILE_TZ });
    const dtFallNoon = minuteOffsetToDateTime(720, fallTransitionDate);
    expect(dtFallNoon.hour).toBe(12);
    expect(dtFallNoon.minute).toBe(0);
  });

  it('correctly calculates transition countdowns and next status transitions', () => {
    expect(formatMinutesCountdown(45)).toBe('45m');
    expect(formatMinutesCountdown(90)).toBe('1h 30m');
    expect(formatMinutesCountdown(120)).toBe('2h');
    expect(formatMinutesCountdown(1440)).toBe('1d');
    expect(formatMinutesCountdown(1500)).toBe('1d 1h');
    expect(formatMinutesCountdown(6418)).toBe('4d 10h 58m');

    // Tuesday 14:30 New York time (regular session ends at 16:00 -> 90m remaining)
    const dtOpen = DateTime.fromISO('2026-09-15T14:30:00', { zone: 'America/New_York' });
    const evalOpen = evaluateMarketAt(nyse, dtOpen);
    expect(evalOpen.status).toBe('open');
    expect(evalOpen.nextTransition).toBeDefined();
    expect(evalOpen.nextTransition?.type).toBe('close');
    expect(evalOpen.nextTransition?.inMinutes).toBe(90);
    expect(evalOpen.nextTransition?.formattedCountdown).toBe('Cierra en 1h 30m');

    // Tuesday 08:30 New York time (market opens at 09:30 -> 60m remaining)
    const dtBefore = DateTime.fromISO('2026-09-15T08:30:00', { zone: 'America/New_York' });
    const evalBefore = evaluateMarketAt(nyse, dtBefore);
    expect(evalBefore.status).toBe('closed');
    expect(evalBefore.nextTransition?.type).toBe('open');
    expect(evalBefore.nextTransition?.inMinutes).toBe(60);
    expect(evalBefore.nextTransition?.formattedCountdown).toBe('Abre en 1h');
  });
});
