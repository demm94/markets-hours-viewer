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
    // KRX should NOT be in activeMarkets because it's a holiday
    expect(asiaNight?.activeMarkets.some((m) => m.id === 'krx')).toBe(false);
    expect(asiaNight?.holidayNames?.some((h) => h.includes('Corea del Sur'))).toBe(true);
  });
});
