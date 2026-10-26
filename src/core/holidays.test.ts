import { describe, it, expect } from 'vitest';
import { DateTime } from 'luxon';
import {
  getMarketHoliday,
  isMarketHoliday,
  isEarlyCloseDay,
  getEffectiveMarketSessions,
  getUpcomingHolidays
} from './holidays';
import { evaluateMarketAt, projectMarketToTimeline } from './timezone';
import { MARKETS, CHILE_CONFIG } from './markets';
import { MarketConfig } from './types';

describe('market holidays engine', () => {
  const nyse = MARKETS.find((m) => m.id === 'nyse')!;
  const sse = MARKETS.find((m) => m.id === 'sse')!;
  const krx = MARKETS.find((m) => m.id === 'krx')!;
  const chile = CHILE_CONFIG;
  const chileMarket: MarketConfig = {
    ...chile,
    sessions: [{ type: 'regular', start: '09:30', end: '16:00', label: 'Rueda normal' }]
  };

  it('correctly detects official exchange holidays via getMarketHoliday and isMarketHoliday', () => {
    // NYSE Thanksgiving 2026-11-26
    expect(isMarketHoliday('nyse', '2026-11-26')).toBe(true);
    const nyseThanksgiving = getMarketHoliday('nyse', '2026-11-26');
    expect(nyseThanksgiving).toBeDefined();
    expect(nyseThanksgiving?.name).toBe('Thanksgiving Day');

    // Chile Fiestas Patrias 2026-09-18
    expect(isMarketHoliday('chile', '2026-09-18')).toBe(true);
    const chileFiestas = getMarketHoliday('chile', '2026-09-18');
    expect(chileFiestas?.name).toBe('Fiestas Patrias');

    // China SSE National Day Golden Week 2026-10-01
    expect(isMarketHoliday('sse', '2026-10-01')).toBe(true);

    // Regular trading day
    expect(isMarketHoliday('nyse', '2026-09-15')).toBe(false);
    expect(getMarketHoliday('nyse', '2026-09-15')).toBeUndefined();
  });

  it('evaluates market as closed on holiday with label and holiday details', () => {
    // Thursday, November 26, 2026 at 14:00 NY time (would normally be open)
    const thanksgivingNoon = DateTime.fromObject(
      { year: 2026, month: 11, day: 26, hour: 14, minute: 0 },
      { zone: 'America/New_York' }
    );

    const evaluation = evaluateMarketAt(nyse, thanksgivingNoon);
    expect(evaluation.status).toBe('closed');
    expect(evaluation.activeSegmentLabel).toBe('Feriado: Thanksgiving Day');
    expect(evaluation.holiday).toBeDefined();
    expect(evaluation.holiday?.name).toBe('Thanksgiving Day');
    expect(evaluation.holiday?.date).toBe('2026-11-26');

    // Holiday next transition targets the next trading day (Friday)
    expect(evaluation.nextTransition).toBeDefined();
    expect(evaluation.nextTransition?.type).toBe('open');
    expect(evaluation.nextTransition?.formattedCountdown).toContain('Abre vie');
  });

  it('allows simulation mode to evaluate scheduled sessions even on holidays', () => {
    // Thursday, November 26, 2026 at 14:00 NY time with isSimulation: true
    const thanksgivingNoon = DateTime.fromObject(
      { year: 2026, month: 11, day: 26, hour: 14, minute: 0 },
      { zone: 'America/New_York' }
    );

    const simEvaluation = evaluateMarketAt(nyse, thanksgivingNoon, { isSimulation: true });
    expect(simEvaluation.status).toBe('open');
    expect(simEvaluation.holiday).toBeUndefined();
  });

  it('evaluates Chilean market holiday accurately on Fiestas Patrias (2026-09-18)', () => {
    // Friday, September 18, 2026 at 11:30 Santiago time (normally regular session 09:30-16:00)
    const fiestasPatriasMorning = DateTime.fromObject(
      { year: 2026, month: 9, day: 18, hour: 11, minute: 30 },
      { zone: 'America/Santiago' }
    );

    const evaluation = evaluateMarketAt(chileMarket, fiestasPatriasMorning);
    expect(evaluation.status).toBe('closed');
    expect(evaluation.activeSegmentLabel).toBe('Feriado: Fiestas Patrias');
    expect(evaluation.holiday?.name).toBe('Fiestas Patrias');
  });

  it('handles extended Asian holidays such as China Golden Week across multiple days', () => {
    // Thursday, October 1, 2026 at 10:00 Shanghai time
    const goldenWeekDay1 = DateTime.fromObject(
      { year: 2026, month: 10, day: 1, hour: 10, minute: 0 },
      { zone: 'Asia/Shanghai' }
    );

    const evalDay1 = evaluateMarketAt(sse, goldenWeekDay1);
    expect(evalDay1.status).toBe('closed');
    expect(evalDay1.activeSegmentLabel).toContain('Día Nacional');
    expect(evalDay1.holiday).toBeDefined();
  });

  it('retrieves upcoming holidays sorted chronologically with relative descriptors', () => {
    // Reference date: September 1, 2026
    const refDate = DateTime.fromISO('2026-09-01T12:00:00', { zone: 'America/Santiago' });
    const upcoming = getUpcomingHolidays(refDate, { maxDaysAhead: 60 });

    expect(upcoming.length).toBeGreaterThan(0);
    // Should be sorted by relativeDays ascending
    for (let i = 0; i < upcoming.length - 1; i++) {
      expect(upcoming[i].relativeDays).toBeLessThanOrEqual(upcoming[i + 1].relativeDays);
    }

    // Labor Day for NYSE on 2026-09-07 (6 days later)
    const laborDay = upcoming.find((h) => h.marketId === 'nyse' && h.date === '2026-09-07');
    expect(laborDay).toBeDefined();
    expect(laborDay?.relativeDays).toBe(6);
    expect(laborDay?.relativeDescriptor).toBe('En 6 días');

    // Filter by specific market
    const chileOnly = getUpcomingHolidays(refDate, { marketId: 'chile', maxDaysAhead: 60 });
    expect(chileOnly.every((h) => h.marketId === 'chile')).toBe(true);
    expect(chileOnly.some((h) => h.name === 'Fiestas Patrias')).toBe(true);

    const sundayNightChile = DateTime.fromISO('2026-10-04T22:00:00', { zone: 'America/Santiago' });
    const krxUpcoming = getUpcomingHolidays(sundayNightChile, { marketId: 'krx', maxDaysAhead: 10 });
    const krxOct5 = krxUpcoming.find((h) => h.date === '2026-10-05');
    expect(krxOct5?.relativeDays).toBe(0);
    expect(krxOct5?.relativeDescriptor).toBe('Hoy');
  });

  it('evaluates sanitized market holidays accurately including Korean substitute holidays', () => {
    // Memorial Day (June 6) and India Independence (Aug 15) fall on Saturday and must NOT close Friday
    expect(isMarketHoliday('krx', '2026-06-05')).toBe(false);
    expect(isMarketHoliday('nse', '2026-08-14')).toBe(false);

    // Korea Labor Day (May 1) is an official exchange closure
    expect(isMarketHoliday('krx', '2026-05-01')).toBe(true);

    // National Foundation Day (Oct 3 Sat) yields Monday Oct 5 substitute holiday for KRX
    expect(isMarketHoliday('krx', '2026-10-05')).toBe(true);
    const sundayNightChile = DateTime.fromISO('2026-10-04T20:00:00', { zone: 'America/Santiago' });
    const evalSundayNight = evaluateMarketAt(krx, sundayNightChile);
    expect(evalSundayNight.holiday).toBeDefined();
    expect(evalSundayNight.holiday?.name).toBe('Fundación Nacional (observado)');

    // China on Monday Oct 5 is closed for National Day Golden Week
    const evalChinaMonday = evaluateMarketAt(sse, sundayNightChile);
    expect(evalChinaMonday.holiday).toBeDefined();
    expect(evalChinaMonday.holiday?.name).toContain('Día Nacional');

    // Tuesday afternoon in Chile -> Wednesday in Seoul. Holiday is concluded
    const evalTuesday = evaluateMarketAt(krx, DateTime.fromISO('2026-10-06T14:00:00', { zone: 'America/Santiago' }));
    expect(evalTuesday.holiday).toBeUndefined();

    // Korea on Friday 02:00 Chile -> Friday 14:00 Seoul. Korea has Hangeul Day holiday (2026-10-09)
    const fridayEarlyChile = DateTime.fromISO('2026-10-09T02:00:00', { zone: 'America/Santiago' });
    const evalFriday = evaluateMarketAt(krx, fridayEarlyChile);
    expect(evalFriday.holiday).toBeDefined();
    expect(evalFriday.holiday?.name).toBe('Día del Hangeul');
  });

  describe('early close / half-day sessions', () => {
    it('correctly identifies early close days without marking them as full-day closures', () => {
      // Black Friday 2026-11-27
      expect(isEarlyCloseDay('nyse', '2026-11-27')).toBe(true);
      expect(isMarketHoliday('nyse', '2026-11-27')).toBe(false);

      const holiday = getMarketHoliday('nyse', '2026-11-27');
      expect(holiday?.isEarlyClose).toBe(true);
      expect(holiday?.closeTime).toBe('13:00');

      // Regular day
      expect(isEarlyCloseDay('nyse', '2026-11-25')).toBe(false);
      // Full holiday
      expect(isEarlyCloseDay('nyse', '2026-11-26')).toBe(false);
    });

    it('shortens effective market sessions on an early close day', () => {
      const normalSessions = nyse.sessions;
      expect(normalSessions[0].end).toBe('16:00');

      const blackFridaySessions = getEffectiveMarketSessions(nyse, '2026-11-27');
      expect(blackFridaySessions).toHaveLength(1);
      expect(blackFridaySessions[0].start).toBe('09:30');
      expect(blackFridaySessions[0].end).toBe('13:00');
      expect(blackFridaySessions[0].label).toContain('13:00');
    });

    it('evaluates market as open before early close time and counts down to early close', () => {
      // 2026-11-27 at 11:00 NY time (13:00 Chile time)
      const blackFridayMorningNY = DateTime.fromObject(
        { year: 2026, month: 11, day: 27, hour: 11, minute: 0 },
        { zone: 'America/New_York' }
      );

      const evaluation = evaluateMarketAt(nyse, blackFridayMorningNY);
      expect(evaluation.status).toBe('open');
      expect(evaluation.holiday?.isEarlyClose).toBe(true);
      expect(evaluation.nextTransition).toBeDefined();
      expect(evaluation.nextTransition?.type).toBe('close');
      expect(evaluation.nextTransition?.inMinutes).toBe(120); // 2 hours until 13:00
      expect(evaluation.nextTransition?.formattedCountdown).toBe('Cierra en 2h');
    });

    it('evaluates market as closed after early close time and targets the next regular day', () => {
      // 2026-11-27 at 13:30 NY time (after 13:00 early close)
      const blackFridayAfternoonNY = DateTime.fromObject(
        { year: 2026, month: 11, day: 27, hour: 13, minute: 30 },
        { zone: 'America/New_York' }
      );

      const evaluation = evaluateMarketAt(nyse, blackFridayAfternoonNY);
      expect(evaluation.status).toBe('closed');
      expect(evaluation.activeSegmentLabel).toContain('Cerrado (Black Friday');
      expect(evaluation.holiday?.isEarlyClose).toBe(true);
      expect(evaluation.nextTransition).toBeDefined();
      expect(evaluation.nextTransition?.type).toBe('open');
      expect(evaluation.nextTransition?.formattedCountdown).toContain('Abre lun 09:30');
    });

    it('projects shortened session to timeline on early close days', () => {
      // Reference date: 2026-11-27 (Chile time)
      // NYSE session 09:30-13:00 EST -> 11:30-15:00 Chile (UTC-3 vs UTC-5)
      // 11:30 = 690 min, 15:00 = 900 min
      const refDate = DateTime.fromISO('2026-11-27T12:00:00', { zone: 'America/Santiago' });
      const segments = projectMarketToTimeline(nyse, refDate);

      expect(segments.length).toBeGreaterThan(0);
      const regularSegment = segments.find((s) => s.type === 'regular');
      expect(regularSegment).toBeDefined();
      expect(regularSegment?.startMinute).toBe(11 * 60 + 30);
      expect(regularSegment?.endMinute).toBe(15 * 60); // 900 min (ends at 13:00 NY = 15:00 Chile)
      expect(regularSegment?.holiday?.isEarlyClose).toBe(true);
    });

    it('isolates segment-level holiday metadata across midnight for Asian markets', () => {
      // Monday 2026-10-05 in Chile:
      // - Morning segment (00:00-03:30 Chile) is Monday Oct 5 in Seoul (National Foundation Day holiday)
      // - Night reopen segment (21:00-24:00 Chile) is Tuesday Oct 6 in Seoul (regular open day)
      const refDate = DateTime.fromISO('2026-10-05T12:00:00', { zone: 'America/Santiago' });
      const krxSegments = projectMarketToTimeline(krx, refDate);

      expect(krxSegments).toHaveLength(2);
      expect(krxSegments[0].startMinute).toBe(0);
      expect(krxSegments[0].holiday?.date).toBe('2026-10-05');
      expect(krxSegments[0].holiday?.isEarlyClose).toBeUndefined();

      expect(krxSegments[1].endMinute).toBe(1440);
      expect(krxSegments[1].holiday).toBeUndefined();
    });
  });
});

