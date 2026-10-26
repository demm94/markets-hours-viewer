import { describe, it, expect } from 'vitest';
import { DateTime } from 'luxon';
import {
  MARKET_EVENTS,
  MARKET_TIMEZONE_MAP,
  formatEventTimes,
  filterEvents,
  getUpcomingEvents,
  hasHighImpactEventsToday,
  getEventsForChileDay,
  getRollingDaysWindow,
  inferCategory,
  getDataFreshnessStatus
} from './events';
import { MARKET_HOLIDAYS } from './holidays';
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

  it('should support parameterized referenceZone for non-Chile reference clocks', () => {
    // 2026-09-16 18:00:00 UTC -> 13:00 in America/Lima (UTC-5)
    const fomcEvent: MarketEvent = {
      id: 'test-fomc-lima',
      marketId: 'nyse',
      title: 'FOMC Rate Decision',
      category: 'central_bank',
      importance: 'high',
      timestampUtc: '2026-09-16T18:00:00Z'
    };

    const formattedLima = formatEventTimes(fomcEvent, referenceChileNow, 'America/Lima');
    expect(formattedLima.chileTimeFormatted).toContain('13:00');
    expect(formattedLima.exchangeTimeFormatted).toContain('14:00');
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

  describe('getRollingDaysWindow', () => {
    it('should generate 7 days by default starting from reference date', () => {
      const days = getRollingDaysWindow(referenceChileNow);
      expect(days).toHaveLength(7);
      expect(days[0].isoDate).toBe('2026-09-16');
      expect(days[0].isToday).toBe(true);
      expect(days[0].label).toBe('Hoy');
      expect(days[1].isoDate).toBe('2026-09-17');
      expect(days[1].isToday).toBe(false);
      expect(days[1].label).toBe('Mañana');
      expect(days[6].isoDate).toBe('2026-09-22');
      expect(days[6].isToday).toBe(false);
      expect(days[6].dayOfMonth).toBe(22);
    });

    it('should identify days with events and high impact events', () => {
      const days = getRollingDaysWindow(referenceChileNow);
      // Sep 16 has FOMC (high impact)
      expect(days[0].hasEvents).toBe(true);
      expect(days[0].hasHighImpact).toBe(true);
      expect(days[0].eventCount).toBeGreaterThan(0);
    });

    it('should support custom daysCount parameter', () => {
      const days = getRollingDaysWindow(referenceChileNow, 3);
      expect(days).toHaveLength(3);
      expect(days.map((d) => d.isoDate)).toEqual(['2026-09-16', '2026-09-17', '2026-09-18']);
    });

    it('should provide upcoming macroeconomic catalysts across Q4 2026 and Q1 2027 for all markets', () => {
      const oct16Now = DateTime.fromISO('2026-10-16T00:00:00', { zone: 'America/Santiago' });
      const upcoming = getUpcomingEvents(oct16Now, { maxDaysAhead: 120 });

      expect(upcoming.length).toBeGreaterThanOrEqual(20);
      const coveredMarkets = new Set(upcoming.map((e) => e.marketId));
      expect(coveredMarkets.has('nyse')).toBe(true);
      expect(coveredMarkets.has('sse')).toBe(true);
      expect(coveredMarkets.has('twse')).toBe(true);
      expect(coveredMarkets.has('krx')).toBe(true);
      expect(coveredMarkets.has('nse')).toBe(true);
      expect(coveredMarkets.has('chile')).toBe(true);
    });
  });

  describe('inferCategory', () => {
    it('should correctly classify employment events with priority over central bank rates', () => {
      expect(inferCategory('Unemployment Rate')).toBe('employment');
      expect(inferCategory('Initial Jobless Claims')).toBe('employment');
      expect(inferCategory('Nonfarm Payrolls')).toBe('employment');
      expect(inferCategory('US ADP Employment Change')).toBe('employment');
      expect(inferCategory('Tasa de desempleo INE')).toBe('employment');
      expect(inferCategory('JOLTS Job Openings')).toBe('employment');
    });

    it('should correctly classify inflation events with word boundary safety', () => {
      expect(inferCategory('CPI YoY')).toBe('inflation');
      expect(inferCategory('US PPI Final Demand MoM')).toBe('inflation');
      expect(inferCategory('Core PCE Price Index')).toBe('inflation');
      expect(inferCategory('Inflation Rate YoY')).toBe('inflation');
      expect(inferCategory('IPC Mensual')).toBe('inflation');
    });

    it('should prevent false positives from substring collisions in word boundaries', () => {
      // "shipping" or "clipping" contains "ppi" substring but is not PPI
      expect(inferCategory('Global Shipping Freight Index')).not.toBe('inflation');
      // "confederation" contains "fed" substring but is not the Federal Reserve
      expect(inferCategory('Confederation of British Industry Survey')).not.toBe('central_bank');
    });

    it('should correctly classify central bank decisions and meetings', () => {
      expect(inferCategory('FOMC Rate Decision')).toBe('central_bank');
      expect(inferCategory('Federal Reserve Interest Rate Decision')).toBe('central_bank');
      expect(inferCategory('PBoC Loan Prime Rate 1Y')).toBe('central_bank');
      expect(inferCategory('Decisión de política monetaria RPM Banco Central')).toBe('central_bank');
      expect(inferCategory('Bank of Korea Policy Rate')).toBe('central_bank');
    });

    it('should correctly classify growth, PMI and GDP metrics', () => {
      expect(inferCategory('GDP Annual Growth Rate')).toBe('gdp');
      expect(inferCategory('PMI Manufacturero S&P Global')).toBe('gdp');
      expect(inferCategory('ISM Manufacturing PMI')).toBe('gdp');
      expect(inferCategory('Retail Sales MoM')).toBe('gdp');
      expect(inferCategory('Producción Industrial')).toBe('gdp');
      expect(inferCategory('Trade Balance')).toBe('gdp');
    });

    it('should correctly classify holidays', () => {
      expect(inferCategory('Market Holiday - Thanksgiving')).toBe('holidays');
      expect(inferCategory('Feriado Bancario - Fiestas Patrias')).toBe('holidays');
    });
  });

  describe('getDataFreshnessStatus', () => {
    it('should report fresh data when current time is well within calendar horizon', () => {
      const sepNow = DateTime.fromISO('2026-09-01T12:00:00', { zone: 'America/Santiago' });
      const status = getDataFreshnessStatus(sepNow);

      expect(status.isStale).toBe(false);
      expect(status.daysUntilExpiry).toBeGreaterThan(14);
      expect(status.message).toBeUndefined();
      expect(status.latestEventDateStr).toBeDefined();
    });

    it('should warn when reference time is close to or past calendar horizon', () => {
      // Future date past the latest event in 2027
      const lateFuture = DateTime.fromISO('2027-04-01T12:00:00', { zone: 'America/Santiago' });
      const status = getDataFreshnessStatus(lateFuture);

      expect(status.isStale).toBe(true);
      expect(status.daysUntilExpiry).toBeLessThanOrEqual(14);
      expect(status.message).toContain('requiere actualización');
    });
  });

  describe('JSON dataset schema & referential integrity', () => {
    it('validates all committed events in events.json conform to schema and valid marketIds', () => {
      const validCategories = new Set(['employment', 'inflation', 'central_bank', 'gdp', 'holidays']);
      const validImportance = new Set(['high', 'medium']);

      expect(MARKET_EVENTS.length).toBeGreaterThan(0);
      for (const evt of MARKET_EVENTS) {
        expect(evt.id.trim().length).toBeGreaterThan(0);
        expect(MARKET_TIMEZONE_MAP[evt.marketId]).toBeDefined();
        expect(evt.title.trim().length).toBeGreaterThan(0);
        expect(validCategories.has(evt.category)).toBe(true);
        expect(validImportance.has(evt.importance)).toBe(true);
        expect(DateTime.fromISO(evt.timestampUtc, { zone: 'utc' }).isValid).toBe(true);
      }
    });

    it('validates all committed holidays in holidays.json conform to schema and valid early-close format', () => {
      const hhMmRe = /^([01]\d|2[0-3]):[0-5]\d$/;

      expect(MARKET_HOLIDAYS.length).toBeGreaterThan(0);
      for (const hol of MARKET_HOLIDAYS) {
        expect(MARKET_TIMEZONE_MAP[hol.marketId]).toBeDefined();
        expect(DateTime.fromFormat(hol.date, 'yyyy-MM-dd').isValid).toBe(true);
        expect(hol.name.trim().length).toBeGreaterThan(0);
        if (hol.isEarlyClose) {
          expect(hol.closeTime).toBeDefined();
          expect(hhMmRe.test(hol.closeTime!)).toBe(true);
        }
      }
    });
  });
});
