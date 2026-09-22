import { describe, it, expect } from 'vitest';
import { DateTime } from 'luxon';
import {
  MARKET_EVENTS,
  formatEventTimes,
  filterEvents,
  getUpcomingEvents,
  hasHighImpactEventsToday,
  getEventsForChileDay
} from './events';
import { MarketEvent } from './types';

describe('events engine', () => {
  const referenceChileNow = DateTime.fromISO('2026-09-16T12:00:00', { zone: 'America/Santiago' });

  it('should correctly format times in Chilean time and exchange local time', () => {
    // FOMC is at 2026-09-16 18:00:00 UTC
    // Chile in Sep 2026 is UTC-3 (DST started first Sunday of Sep) -> 18:00 UTC = 15:00 Chile
    // US Eastern (EDT) in Sep is UTC-4 -> 18:00 UTC = 14:00 New York
    const fomcEvent: MarketEvent = {
      id: 'test-fomc',
      marketId: 'nyse',
      title: 'FOMC Rate Decision',
      category: 'central_bank',
      importance: 'high',
      timestampUtc: '2026-09-16T18:00:00Z'
    };

    const formatted = formatEventTimes(fomcEvent, referenceChileNow);

    expect(formatted.chileTimeFormatted).toContain('15:00');
    expect(formatted.exchangeTimeFormatted).toContain('14:00');
    expect(formatted.relativeTimeDescriptor).toBe('Hoy');
  });

  it('should compute relative day descriptors accurately', () => {
    const tomorrowEvent: MarketEvent = {
      id: 'test-tomorrow',
      marketId: 'twse',
      title: 'Taiwan CBC',
      category: 'central_bank',
      importance: 'high',
      timestampUtc: '2026-09-17T09:00:00Z'
    };

    const formatted = formatEventTimes(tomorrowEvent, referenceChileNow);
    expect(formatted.relativeTimeDescriptor).toBe('Mañana');
  });

  it('should filter events by marketId', () => {
    const allEvents = MARKET_EVENTS;
    const nyseOnly = filterEvents(allEvents, { marketId: 'nyse' });
    expect(nyseOnly.length).toBeGreaterThan(0);
    expect(nyseOnly.every((e) => e.marketId === 'nyse')).toBe(true);
  });

  it('should filter events by high importance', () => {
    const highOnly = filterEvents(MARKET_EVENTS, { minImportance: 'high' });
    expect(highOnly.length).toBeGreaterThan(0);
    expect(highOnly.every((e) => e.importance === 'high')).toBe(true);
  });

  it('should return upcoming events ordered chronologically', () => {
    const upcoming = getUpcomingEvents(referenceChileNow, { maxDaysAhead: 30 });
    expect(upcoming.length).toBeGreaterThan(0);

    for (let i = 0; i < upcoming.length - 1; i++) {
      expect(upcoming[i].timestampUtc <= upcoming[i + 1].timestampUtc).toBe(true);
    }
  });

  it('should detect when a market has high-impact events today in Chile', () => {
    // On 2026-09-16, NYSE has FOMC (high impact)
    const hasNyseToday = hasHighImpactEventsToday('nyse', referenceChileNow);
    expect(hasNyseToday).toBe(true);

    // Korea doesn't have an event on 2026-09-16
    const hasKrxToday = hasHighImpactEventsToday('krx', referenceChileNow);
    expect(hasKrxToday).toBe(false);
  });

  it('should project events for a specific Chile day with correct minutes and percentages', () => {
    // 2026-09-16: FOMC at 18:00 UTC = 15:00 Chile (UTC-3)
    const dailyMap = getEventsForChileDay(referenceChileNow);
    expect(dailyMap['nyse']).toBeDefined();
    expect(dailyMap['nyse'].length).toBe(1);

    const fomc = dailyMap['nyse'][0];
    expect(fomc.id).toBe('us-fomc-sep-2026');
    expect(fomc.importance).toBe('high');
    expect(fomc.minuteInChile).toBe(15 * 60); // 900 minutes
    expect(fomc.leftPercent).toBeCloseTo((900 / 1440) * 100, 2);
    expect(fomc.chileTimeFormatted).toContain('15:00');

    // Korea and Taiwan have no events on Sep 16 in Chile
    expect(dailyMap['krx']).toBeUndefined();
    expect(dailyMap['twse']).toBeUndefined();
  });

  it('should correctly handle UTC-to-Chile midnight transitions for daily projection', () => {
    // PBoC LPR is 2026-09-20T01:15:00Z.
    // In Chile (UTC-3), this is 2026-09-19 22:15:00 (minute 1335).
    const sep19Chile = DateTime.fromISO('2026-09-19T10:00:00', { zone: 'America/Santiago' });
    const sep19Map = getEventsForChileDay(sep19Chile);
    expect(sep19Map['sse']).toBeDefined();
    expect(sep19Map['sse'][0].id).toBe('cn-pboc-lpr-sep-2026');
    expect(sep19Map['sse'][0].minuteInChile).toBe(22 * 60 + 15); // 1335 min

    const sep20Chile = DateTime.fromISO('2026-09-20T10:00:00', { zone: 'America/Santiago' });
    const sep20Map = getEventsForChileDay(sep20Chile);
    expect(sep20Map['sse']).toBeUndefined();
  });
});
