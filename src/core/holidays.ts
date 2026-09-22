import { DateTime } from 'luxon';
import { MarketHoliday } from './types';
import rawHolidays from '../data/holidays.json';
import { MARKETS, CHILE_CONFIG } from './markets';

export const MARKET_HOLIDAYS: MarketHoliday[] = rawHolidays as MarketHoliday[];

// Map keyed by `${marketId}:${date}` for O(1) lookups
const HOLIDAYS_BY_KEY = new Map<string, MarketHoliday>();
for (const holiday of MARKET_HOLIDAYS) {
  HOLIDAYS_BY_KEY.set(`${holiday.marketId}:${holiday.date}`, holiday);
}

/**
 * Returns the MarketHoliday for a market on a given local date (YYYY-MM-DD), or undefined if regular day.
 */
export function getMarketHoliday(marketId: string, localDateStr: string): MarketHoliday | undefined {
  return HOLIDAYS_BY_KEY.get(`${marketId}:${localDateStr}`);
}

/**
 * Checks if a market is closed for holiday on a given local date (YYYY-MM-DD).
 */
export function isMarketHoliday(marketId: string, localDateStr: string): boolean {
  return HOLIDAYS_BY_KEY.has(`${marketId}:${localDateStr}`);
}

export interface UpcomingHoliday extends MarketHoliday {
  marketName: string;
  marketFlag: string;
  relativeDays: number;
  relativeDescriptor: string;
  dateFormatted: string;
}

const MARKET_INFO_MAP: Record<string, { name: string; flag: string }> = {
  [CHILE_CONFIG.id]: { name: CHILE_CONFIG.name, flag: CHILE_CONFIG.flag },
  ...Object.fromEntries(MARKETS.map((m) => [m.id, { name: m.name, flag: m.flag }]))
};

/**
 * Retrieves upcoming holidays across markets within a given number of days from chileNow.
 */
export function getUpcomingHolidays(
  chileNow: DateTime,
  options: { marketId?: string; maxDaysAhead?: number } = {}
): UpcomingHoliday[] {
  const maxDays = options.maxDaysAhead ?? 120;
  const chileToday = chileNow.setZone('America/Santiago').startOf('day');
  const cutoff = chileToday.plus({ days: maxDays });

  const result: UpcomingHoliday[] = [];

  for (const holiday of MARKET_HOLIDAYS) {
    if (options.marketId && options.marketId !== 'all' && holiday.marketId !== options.marketId) {
      continue;
    }

    const holDate = DateTime.fromISO(holiday.date, { zone: 'America/Santiago' }).startOf('day');
    const diffDays = Math.round(holDate.diff(chileToday, 'days').days);

    // Only include today or future up to cutoff
    if (diffDays >= 0 && holDate <= cutoff) {
      let relativeDescriptor = '';
      if (diffDays === 0) {
        relativeDescriptor = 'Hoy';
      } else if (diffDays === 1) {
        relativeDescriptor = 'Mañana';
      } else {
        relativeDescriptor = `En ${diffDays} días`;
      }

      const info = MARKET_INFO_MAP[holiday.marketId] || { name: holiday.marketId, flag: '🏛️' };

      result.push({
        ...holiday,
        marketName: info.name,
        marketFlag: info.flag,
        relativeDays: diffDays,
        relativeDescriptor,
        dateFormatted: holDate.toFormat('ccc d LLL', { locale: 'es' })
      });
    }
  }

  // Sort by date ascending, then by marketId
  return result.sort((a, b) => a.relativeDays - b.relativeDays || a.marketId.localeCompare(b.marketId));
}
