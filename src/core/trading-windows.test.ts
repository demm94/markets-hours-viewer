import { describe, it, expect } from 'vitest';
import { DateTime } from 'luxon';
import { getTradingWindows } from './trading-windows';
import { MARKETS } from './markets';
import { CHILE_TZ } from './timezone';

describe('trading-windows engine', () => {
  it('computes 6 comprehensive trading windows spanning 24h of Chile reference time', () => {
    const testDate = DateTime.fromISO('2026-09-15T12:00:00', { zone: CHILE_TZ });
    const windows = getTradingWindows(testDate, MARKETS, 720); // 12:00 = 720m (US session)

    expect(windows.length).toBe(6);

    // Continuous 24h coverage
    expect(windows[0].startMinute).toBe(0);
    expect(windows[windows.length - 1].endMinute).toBe(1440);

    for (let i = 0; i < windows.length - 1; i++) {
      expect(windows[i].endMinute).toBe(windows[i + 1].startMinute);
    }

    // US session window must be current at 12:00 (720 min)
    const usWindow = windows.find((w) => w.id === 'us_session');
    expect(usWindow).toBeDefined();
    expect(usWindow?.isCurrent).toBe(true);
    expect(usWindow?.liquidityLevel).toBe('high');
    expect(usWindow?.progressPercent).toBeGreaterThan(0);
    expect(usWindow?.activeMarkets.some((m) => m.id === 'nyse')).toBe(true);

    // Other windows must not be marked current
    const nonCurrent = windows.filter((w) => w.id !== 'us_session');
    expect(nonCurrent.every((w) => !w.isCurrent)).toBe(true);
  });

  it('accurately identifies Asian convergence concurrency during midnight window', () => {
    const testDate = DateTime.fromISO('2026-09-15T01:30:00', { zone: CHILE_TZ });
    const windows = getTradingWindows(testDate, MARKETS, 90); // 01:30 = 90 min

    const asiaNight = windows.find((w) => w.id === 'asia_night');
    expect(asiaNight).toBeDefined();
    expect(asiaNight?.isCurrent).toBe(true);
    expect(asiaNight?.concurrencyCount).toBeGreaterThanOrEqual(3);
    expect(asiaNight?.liquidityLevel).toBe('high');
    expect(asiaNight?.activeMarkets.some((m) => m.id === 'twse')).toBe(true);
    expect(asiaNight?.activeMarkets.some((m) => m.id === 'krx')).toBe(true);
  });

  it('marks holidays accurately when an exchange is closed in a window', () => {
    // 2026-10-05: Korea is closed for National Foundation Day (observed)
    const koreaHolidayDate = DateTime.fromISO('2026-10-05T01:00:00', { zone: CHILE_TZ });
    const windows = getTradingWindows(koreaHolidayDate, MARKETS, 60);

    const asiaNight = windows.find((w) => w.id === 'asia_night');
    expect(asiaNight).toBeDefined();
    // KRX should NOT be in activeMarkets because it's a holiday in Seoul on Monday Oct 5
    expect(asiaNight?.activeMarkets.some((m) => m.id === 'krx')).toBe(false);
    expect(asiaNight?.holidayNames?.some((h) => h.includes('Corea del Sur'))).toBe(true);

    // However, in asia_reopen (22:00 - 24:00 Monday Chile time), it is already Tuesday Oct 6 in Seoul!
    // Korea holiday is over, so KRX MUST be active and NOT marked as holiday.
    const asiaReopen = windows.find((w) => w.id === 'asia_reopen');
    expect(asiaReopen).toBeDefined();
    expect(asiaReopen?.activeMarkets.some((m) => m.id === 'krx')).toBe(true);
    expect(asiaReopen?.holidayNames?.some((h) => h.includes('Corea del Sur'))).toBe(false);

    // China is still in Golden Week on Tuesday Oct 6
    expect(asiaReopen?.holidayNames?.some((h) => h.includes('China'))).toBe(true);
  });

  it('correctly treats Friday night in Chile as closed for Asian reopen due to weekend in Asia', () => {
    // 2026-10-16 is Friday. At 23:00 Chile (minute 1380), it is 10:00 Saturday morning in Taipei & 11:00 in Seoul.
    const fridayNightDate = DateTime.fromISO('2026-10-16T23:00:00', { zone: CHILE_TZ });
    const windows = getTradingWindows(fridayNightDate, MARKETS, 1380);

    const asiaReopen = windows.find((w) => w.id === 'asia_reopen');
    expect(asiaReopen).toBeDefined();
    // In Asia it is Saturday morning -> weekend -> 0 active markets
    expect(asiaReopen?.concurrencyCount).toBe(0);
    expect(asiaReopen?.activeMarkets.length).toBe(0);
    expect(asiaReopen?.liquidityLevel).toBe('quiet');
  });

  it('correctly marks markets closed and liquidity as quiet on Saturday', () => {
    // 2026-10-17 is Saturday
    const saturdayDate = DateTime.fromISO('2026-10-17T12:00:00', { zone: CHILE_TZ });
    const windows = getTradingWindows(saturdayDate, MARKETS, 720);

    const usSession = windows.find((w) => w.id === 'us_session');
    expect(usSession).toBeDefined();
    expect(usSession?.activeMarkets.length).toBe(0);
    expect(usSession?.concurrencyCount).toBe(0);
    expect(usSession?.liquidityLevel).toBe('quiet');
  });

  it('correctly reopens Asian markets on Sunday night Chile time (Monday morning in Asia)', () => {
    // 2026-10-18 is Sunday. At 23:00 Chile, it is Monday morning in Taipei, Seoul, Shanghai.
    const sundayNightDate = DateTime.fromISO('2026-10-18T23:00:00', { zone: CHILE_TZ });
    const windows = getTradingWindows(sundayNightDate, MARKETS, 1380);

    const asiaReopen = windows.find((w) => w.id === 'asia_reopen');
    expect(asiaReopen).toBeDefined();
    expect(asiaReopen?.activeMarkets.length).toBeGreaterThanOrEqual(2);
    expect(asiaReopen?.liquidityLevel).toBe('high');
  });

  it('simulates scheduled sessions on weekends when isSimulation option is enabled', () => {
    const saturdayDate = DateTime.fromISO('2026-10-17T12:00:00', { zone: CHILE_TZ });
    const windows = getTradingWindows(saturdayDate, MARKETS, 720, { isSimulation: true });

    const usSession = windows.find((w) => w.id === 'us_session');
    expect(usSession).toBeDefined();
    expect(usSession?.activeMarkets.some((m) => m.id === 'nyse')).toBe(true);
    expect(usSession?.liquidityLevel).toBe('high');
  });

  it('maintains strictly positive durations and accurate India regular close across Chile Summer (UTC-3) and Winter (UTC-4) DST regimes', () => {
    // Chile Summer Time (UTC-3): NSE pre-market is 00:30-00:45 (30-45m) and regular is 00:45-07:00 (45-420m)
    const summerDate = DateTime.fromISO('2026-10-16T05:00:00', { zone: CHILE_TZ });
    const summerWindows = getTradingWindows(summerDate, MARKETS, 300);

    for (const w of summerWindows) {
      expect(w.endMinute).toBeGreaterThan(w.startMinute);
      expect(w.durationFormatted).not.toContain('-');
    }

    const summerIndiaSolo = summerWindows.find((w) => w.id === 'india_solo');
    expect(summerIndiaSolo?.startMinute).toBe(240);
    expect(summerIndiaSolo?.endMinute).toBe(420); // 07:00 Chile (15:30 IST), not 00:45 pre-market end
    expect(summerIndiaSolo?.durationFormatted).toBe('3h');
    expect(summerIndiaSolo?.activeMarkets.some((m) => m.id === 'nse')).toBe(true);

    // Chile Winter Time (UTC-4): SSE closes at 03:00 (180m) and NSE regular morning segment closes at 06:00 (360m)
    const winterDate = DateTime.fromISO('2026-06-17T05:00:00', { zone: CHILE_TZ });
    const winterWindows = getTradingWindows(winterDate, MARKETS, 300);

    for (const w of winterWindows) {
      expect(w.endMinute).toBeGreaterThan(w.startMinute);
      expect(w.durationFormatted).not.toContain('-');
    }

    const winterAsiaNight = winterWindows.find((w) => w.id === 'asia_night');
    expect(winterAsiaNight?.startMinute).toBe(0);
    expect(winterAsiaNight?.endMinute).toBe(180); // 03:00 Chile (15:00 CST Shanghai close)

    const winterIndiaSolo = winterWindows.find((w) => w.id === 'india_solo');
    expect(winterIndiaSolo?.startMinute).toBe(180); // 03:00 Chile (12:30 IST)
    expect(winterIndiaSolo?.endMinute).toBe(360); // 06:00 Chile (15:30 IST)
    expect(winterIndiaSolo?.durationFormatted).toBe('3h');
    expect(winterIndiaSolo?.activeMarkets.some((m) => m.id === 'nse')).toBe(true);
  });

  it('keeps early-close markets active in trading windows during shortened sessions (Black Friday)', () => {
    const blackFriday = DateTime.fromISO('2026-11-27T12:30:00', { zone: CHILE_TZ });
    const windows = getTradingWindows(blackFriday, MARKETS, 750);

    const usSession = windows.find((w) => w.id === 'us_session');
    expect(usSession).toBeDefined();
    expect(usSession?.startMinute).toBe(690);
    expect(usSession?.endMinute).toBe(900);
    expect(usSession?.activeMarkets.some((m) => m.id === 'nyse')).toBe(true);
    expect(usSession?.concurrencyCount).toBe(1);
    expect(usSession?.liquidityLevel).toBe('high');
  });
});
