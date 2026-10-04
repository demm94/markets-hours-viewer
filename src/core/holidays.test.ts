import { describe, it, expect } from 'vitest';
import { DateTime } from 'luxon';
import { getMarketHoliday, isMarketHoliday, getUpcomingHolidays } from './holidays';
import { evaluateMarketAt } from './timezone';
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
  });

  it('evaluates Asian market holiday lifecycle accurately across Chile reference time without false persistence on subsequent days', () => {
    // Sunday 20:00 Chile (UTC-3) -> Monday 08:00 Seoul (UTC+9). Korea is on holiday (2026-10-05)
    const sundayNightChile = DateTime.fromISO('2026-10-04T20:00:00', { zone: 'America/Santiago' });
    const evalSundayNight = evaluateMarketAt(krx, sundayNightChile);
    expect(evalSundayNight.holiday).toBeDefined();
    expect(evalSundayNight.holiday?.name).toBe('Fundación Nacional (observado)');

    // Monday 08:00 Chile -> Monday 20:00 Seoul. Korea is still in holiday
    const mondayMorningChile = DateTime.fromISO('2026-10-05T08:00:00', { zone: 'America/Santiago' });
    const evalMondayMorning = evaluateMarketAt(krx, mondayMorningChile);
    expect(evalMondayMorning.holiday).toBeDefined();

    // Monday 20:00 Chile -> Tuesday 08:00 Seoul. Korea holiday has concluded (now regular trading day)
    const mondayNightChile = DateTime.fromISO('2026-10-05T20:00:00', { zone: 'America/Santiago' });
    const evalMondayNight = evaluateMarketAt(krx, mondayNightChile);
    expect(evalMondayNight.holiday).toBeUndefined();

    // Tuesday 14:00 Chile -> Wednesday 02:00 Seoul. Korea has no holiday on Tuesday or Wednesday
    const tuesdayAfternoonChile = DateTime.fromISO('2026-10-06T14:00:00', { zone: 'America/Santiago' });
    const evalTuesday = evaluateMarketAt(krx, tuesdayAfternoonChile);
    expect(evalTuesday.holiday).toBeUndefined();

    // Friday 02:00 Chile -> Friday 14:00 Seoul. Korea has Hangeul Day holiday (2026-10-09)
    const fridayEarlyChile = DateTime.fromISO('2026-10-09T02:00:00', { zone: 'America/Santiago' });
    const evalFriday = evaluateMarketAt(krx, fridayEarlyChile);
    expect(evalFriday.holiday).toBeDefined();
    expect(evalFriday.holiday?.name).toBe('Día del Hangeul');
  });
});
