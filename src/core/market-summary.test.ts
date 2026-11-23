import { describe, it, expect } from 'vitest';
import { DateTime } from 'luxon';
import { MARKETS } from './markets';
import { CHILE_TZ, evaluateMarketAt } from './timezone';
import { getLiveStatusSummary, getTodayAgenda } from './market-summary';
import { MarketEvent } from './types';

describe('market-summary domain helpers', () => {
  it('summarizes open markets and identifies the nearest upcoming bell during US and Chile overlap', () => {
    // Tuesday 2026-09-15 15:00 Chile (UTC-3) -> NYSE (closes 17:00 CL = 120m) and Chile (closes 16:00 CL = 60m)
    const nowChile = DateTime.fromISO('2026-09-15T15:00:00', { zone: CHILE_TZ });
    const evaluations = Object.fromEntries(MARKETS.map((m) => [m.id, evaluateMarketAt(m, nowChile)]));

    const summary = getLiveStatusSummary(MARKETS, evaluations);

    expect(summary.isGlobalWeekend).toBe(false);
    expect(summary.openMarkets.map((m) => m.id)).toEqual(['nyse', 'chile']);
    expect(summary.nextBell).toBeDefined();
    expect(summary.nextBell?.market.id).toBe('chile');
    expect(summary.nextBell?.type).toBe('close');
    expect(summary.nextBell?.atChileFormatted).toBe('16:00 CL');
  });

  it('detects global weekend and points to the earliest Sunday-night Asian opening in Chile time', () => {
    // Saturday 2026-10-17 12:00 Chile (UTC-3) -> all markets closed for weekend
    // Earliest reopening is KRX (Mon 09:00 KST = Sun 21:00 CL)
    const satChile = DateTime.fromISO('2026-10-17T12:00:00', { zone: CHILE_TZ });
    const evaluations = Object.fromEntries(MARKETS.map((m) => [m.id, evaluateMarketAt(m, satChile)]));

    const summary = getLiveStatusSummary(MARKETS, evaluations);

    expect(summary.isGlobalWeekend).toBe(true);
    expect(summary.openMarkets).toHaveLength(0);
    expect(summary.nextBell).toBeDefined();
    expect(summary.nextBell?.market.id).toBe('krx');
    expect(summary.nextBell?.atChileFormatted).toBe('dom 21:00 CL');
  });

  it('builds today agenda with holidays, early closes, and sorted macro events', () => {
    // Black Friday 2026-11-27 12:00 Chile -> NYSE early close + synthetic events
    const blackFriday = DateTime.fromISO('2026-11-27T12:00:00', { zone: CHILE_TZ });
    const sampleEvents: MarketEvent[] = [
      {
        id: 'ev-late',
        marketId: 'nyse',
        title: 'PMI Manufacturero',
        category: 'gdp',
        importance: 'medium',
        timestampUtc: '2026-11-27T16:00:00Z'
      },
      {
        id: 'ev-early',
        marketId: 'nyse',
        title: 'IPC EE.UU.',
        category: 'inflation',
        importance: 'high',
        timestampUtc: '2026-11-27T13:30:00Z'
      }
    ];

    const agenda = getTodayAgenda(MARKETS, blackFriday, CHILE_TZ, sampleEvents);

    expect(agenda.hasItems).toBe(true);
    expect(agenda.earlyCloses).toHaveLength(1);
    expect(agenda.earlyCloses[0].marketId).toBe('nyse');
    expect(agenda.holidays).toHaveLength(0);
    expect(agenda.events.map((e) => e.id)).toEqual(['ev-early', 'ev-late']);
    expect(agenda.highImpactCount).toBe(1);
  });

  it('returns hasItems=false when today has no holidays, early closes, or events', () => {
    const quietDay = DateTime.fromISO('2026-09-15T12:00:00', { zone: CHILE_TZ });
    const agenda = getTodayAgenda(MARKETS, quietDay, CHILE_TZ, []);

    expect(agenda.hasItems).toBe(false);
    expect(agenda.holidays).toHaveLength(0);
    expect(agenda.earlyCloses).toHaveLength(0);
    expect(agenda.events).toHaveLength(0);
    expect(agenda.highImpactCount).toBe(0);
  });

  it('does not duplicate Chile holidays or early closes when chile is included in MARKETS and falls back when omitted', () => {
    const fiestasPatrias = DateTime.fromISO('2026-09-18T12:00:00', { zone: CHILE_TZ });
    const holidayAgenda = getTodayAgenda(MARKETS, fiestasPatrias, CHILE_TZ, []);
    expect(holidayAgenda.holidays.filter((h) => h.marketId === 'chile')).toHaveLength(1);

    const newYearsEve = DateTime.fromISO('2026-12-31T10:00:00', { zone: CHILE_TZ });
    const earlyCloseAgenda = getTodayAgenda(MARKETS, newYearsEve, CHILE_TZ, []);
    const chileEarlyCloses = earlyCloseAgenda.earlyCloses.filter((h) => h.marketId === 'chile');
    expect(chileEarlyCloses).toHaveLength(1);
    expect(chileEarlyCloses[0].holiday.closeTime).toBe('12:30');

    const withoutChile = MARKETS.filter((m) => m.id !== 'chile');
    const fallbackAgenda = getTodayAgenda(withoutChile, fiestasPatrias, CHILE_TZ, []);
    expect(fallbackAgenda.holidays.filter((h) => h.marketId === 'chile')).toHaveLength(1);
  });
});
