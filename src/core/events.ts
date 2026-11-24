import { DateTime } from 'luxon';
import {
  MarketEvent,
  MarketHoliday,
  FormattedMarketEvent,
  EventImportance,
  TimelineEventMarkerData,
  RollingDayInfo
} from './types';
import { MARKETS, CHILE_CONFIG } from './markets';
import { inferCategory } from './event-category';
import { MARKET_HOLIDAYS } from './holidays';

export { inferCategory };

export const MARKET_TIMEZONE_MAP: Record<string, string> = {
  [CHILE_CONFIG.id]: CHILE_CONFIG.timezone,
  ...Object.fromEntries(MARKETS.map((m) => [m.id, m.timezone]))
};

import rawEvents from '../data/events.json';

export const MARKET_EVENTS: MarketEvent[] = rawEvents as MarketEvent[];

export interface QueryOptions {
  marketId?: string;
  minImportance?: EventImportance;
  maxDaysAhead?: number;
  referenceZone?: string;
}

export function formatEventTimes(
  event: MarketEvent,
  referenceNow: DateTime,
  referenceZone: string = CHILE_CONFIG.timezone
): FormattedMarketEvent {
  const eventUtc = DateTime.fromISO(event.timestampUtc, { zone: 'utc' });
  const eventInReference = eventUtc.setZone(referenceZone);
  const marketZone = MARKET_TIMEZONE_MAP[event.marketId] || referenceZone;
  const eventInMarket = eventUtc.setZone(marketZone);

  // Calculate day difference relative to reference local day
  const refStartToday = referenceNow.setZone(referenceZone).startOf('day');
  const eventStartDay = eventInReference.startOf('day');
  const diffDays = Math.round(eventStartDay.diff(refStartToday, 'days').days);

  let relativeTimeDescriptor = '';
  if (diffDays === 0) {
    relativeTimeDescriptor = 'Hoy';
  } else if (diffDays === 1) {
    relativeTimeDescriptor = 'Mañana';
  } else if (diffDays === -1) {
    relativeTimeDescriptor = 'Ayer';
  } else if (diffDays > 1) {
    relativeTimeDescriptor = `En ${diffDays} días`;
  } else {
    relativeTimeDescriptor = `Hace ${Math.abs(diffDays)} días`;
  }

  return {
    ...event,
    chileTimeFormatted: `${eventInReference.toFormat('HH:mm')} (${eventInReference.toFormat('d LLL', { locale: 'es' })})`,
    exchangeTimeFormatted: `${eventInMarket.toFormat('HH:mm')} (${eventInMarket.toFormat('d LLL', { locale: 'es' })})`,
    relativeTimeDescriptor
  };
}

export function filterEvents(
  events: MarketEvent[],
  options: { marketId?: string; minImportance?: EventImportance } = {}
): MarketEvent[] {
  return events.filter((e) => {
    if (options.marketId && options.marketId !== 'all' && e.marketId !== options.marketId) {
      return false;
    }
    if (options.minImportance === 'high' && e.importance !== 'high') {
      return false;
    }
    return true;
  });
}

export function getUpcomingEvents(
  chileNow: DateTime,
  options: QueryOptions = {}
): FormattedMarketEvent[] {
  const filtered = filterEvents(MARKET_EVENTS, options);
  const referenceZone = options.referenceZone ?? CHILE_CONFIG.timezone;

  // Filter out events older than 24h prior to chileNow
  const cutoffPast = chileNow.minus({ hours: 24 });
  const maxDays = options.maxDaysAhead ?? 120;
  const cutoffFuture = chileNow.plus({ days: maxDays });

  return filtered
    .filter((e) => {
      const t = DateTime.fromISO(e.timestampUtc, { zone: 'utc' });
      return t >= cutoffPast && t <= cutoffFuture;
    })
    .sort((a, b) => a.timestampUtc.localeCompare(b.timestampUtc))
    .map((e) => formatEventTimes(e, chileNow, referenceZone));
}

export function hasHighImpactEventsToday(
  marketId: string,
  referenceNow: DateTime,
  referenceZone: string = CHILE_CONFIG.timezone
): boolean {
  const todayRefStr = referenceNow.setZone(referenceZone).toFormat('yyyy-MM-dd');
  return MARKET_EVENTS.some((e) => {
    if (e.marketId !== marketId) return false;
    if (e.importance !== 'high') return false;
    const eventInRef = DateTime.fromISO(e.timestampUtc, { zone: 'utc' }).setZone(referenceZone);
    return eventInRef.toFormat('yyyy-MM-dd') === todayRefStr;
  });
}

export function getEventsForChileDay(
  referenceDate: DateTime = DateTime.now().setZone(CHILE_CONFIG.timezone),
  events: MarketEvent[] = MARKET_EVENTS,
  referenceZone: string = CHILE_CONFIG.timezone
): Record<string, TimelineEventMarkerData[]> {
  const refDate = referenceDate.setZone(referenceZone);
  const refStartToday = refDate.startOf('day');
  const refEndToday = refStartToday.plus({ days: 1 });

  const result: Record<string, TimelineEventMarkerData[]> = {};

  for (const event of events) {
    const eventUtc = DateTime.fromISO(event.timestampUtc, { zone: 'utc' });
    const eventInRef = eventUtc.setZone(referenceZone);

    if (eventInRef >= refStartToday && eventInRef < refEndToday) {
      const minuteInChile = eventInRef.hour * 60 + eventInRef.minute;
      const leftPercent = (minuteInChile / 1440) * 100;
      const formatted = formatEventTimes(event, refDate, referenceZone);

      const markerData: TimelineEventMarkerData = {
        ...formatted,
        minuteInChile,
        leftPercent
      };

      if (!result[event.marketId]) {
        result[event.marketId] = [];
      }
      result[event.marketId].push(markerData);
    }
  }

  for (const mId in result) {
    result[mId].sort((a, b) => a.minuteInChile - b.minuteInChile);
  }

  return result;
}

export function getRollingDaysWindow(
  referenceDate: DateTime = DateTime.now().setZone(CHILE_CONFIG.timezone),
  daysCount: number = 7,
  events: MarketEvent[] = MARKET_EVENTS,
  referenceZone: string = CHILE_CONFIG.timezone,
  holidays: MarketHoliday[] = MARKET_HOLIDAYS
): RollingDayInfo[] {
  const refNow = referenceDate.setZone(referenceZone);
  const startOfRefToday = refNow.startOf('day');
  const result: RollingDayInfo[] = [];

  for (let i = 0; i < daysCount; i++) {
    const targetDay = startOfRefToday.plus({ days: i });
    const nextDay = targetDay.plus({ days: 1 });
    const isoDate = targetDay.toFormat('yyyy-MM-dd');

    const rawDay = targetDay.toFormat('ccc', { locale: 'es' });
    const dayOfWeekShort = rawDay.charAt(0).toUpperCase() + rawDay.slice(1).replace('.', '');
    const dayOfMonth = targetDay.day;
    const isToday = i === 0;

    let label = `${dayOfWeekShort} ${dayOfMonth}`;
    if (isToday) {
      label = 'Hoy';
    } else if (i === 1) {
      label = 'Mañana';
    }

    const dayEvents = events.filter((e) => {
      const eventInRef = DateTime.fromISO(e.timestampUtc, { zone: 'utc' }).setZone(referenceZone);
      return eventInRef >= targetDay && eventInRef < nextDay;
    });

    const eventCount = dayEvents.length;
    const hasEvents = eventCount > 0;
    const hasHighImpact = dayEvents.some((e) => e.importance === 'high');

    const dayHolidays = holidays.filter((h) => h.date === isoDate);
    const holidayCount = dayHolidays.filter((h) => !h.isEarlyClose).length;
    const earlyCloseCount = dayHolidays.filter((h) => Boolean(h.isEarlyClose)).length;
    const hasHoliday = holidayCount > 0 || earlyCloseCount > 0;

    result.push({
      date: targetDay,
      isoDate,
      label,
      dayOfWeekShort,
      dayOfMonth,
      isToday,
      hasEvents,
      eventCount,
      hasHighImpact,
      holidayCount,
      earlyCloseCount,
      hasHoliday
    });
  }

  return result;
}

export interface DataFreshnessStatus {
  latestEventDateStr: string;
  isStale: boolean;
  daysUntilExpiry: number;
  message?: string;
}

/**
 * Computes calendar data coverage horizon and warns when data needs a sync or is expired.
 */
export function getDataFreshnessStatus(
  referenceNow: DateTime = DateTime.now().setZone(CHILE_CONFIG.timezone),
  referenceZone: string = CHILE_CONFIG.timezone
): DataFreshnessStatus {
  const refToday = referenceNow.setZone(referenceZone).startOf('day');
  const trackedMarketIds = MARKETS.map((m) => m.id);

  let minEventHorizonStr: string | null = null;
  let minHolidayHorizonStr: string | null = null;

  for (const marketId of trackedMarketIds) {
    let marketMaxEventDate = '2026-01-01';
    for (const e of MARKET_EVENTS) {
      if (e.marketId !== marketId) continue;
      const localDate = DateTime.fromISO(e.timestampUtc, { zone: 'utc' })
        .setZone(referenceZone)
        .toFormat('yyyy-MM-dd');
      if (localDate > marketMaxEventDate) {
        marketMaxEventDate = localDate;
      }
    }
    if (minEventHorizonStr === null || marketMaxEventDate < minEventHorizonStr) {
      minEventHorizonStr = marketMaxEventDate;
    }

    let marketMaxHolidayDate = '2026-01-01';
    for (const h of MARKET_HOLIDAYS) {
      if (h.marketId !== marketId) continue;
      if (h.date > marketMaxHolidayDate) {
        marketMaxHolidayDate = h.date;
      }
    }
    if (minHolidayHorizonStr === null || marketMaxHolidayDate < minHolidayHorizonStr) {
      minHolidayHorizonStr = marketMaxHolidayDate;
    }
  }

  const latestEventDateStr = minEventHorizonStr ?? '2026-01-01';
  const latestHolidayDateStr = minHolidayHorizonStr ?? '2026-01-01';
  const effectiveHorizonStr =
    latestEventDateStr <= latestHolidayDateStr ? latestEventDateStr : latestHolidayDateStr;

  const effectiveHorizonDate = DateTime.fromISO(effectiveHorizonStr, { zone: referenceZone }).startOf('day');
  const daysUntilExpiry = Math.round(effectiveHorizonDate.diff(refToday, 'days').days);
  const isStale = daysUntilExpiry <= 14;

  return {
    latestEventDateStr,
    isStale,
    daysUntilExpiry,
    ...(isStale
      ? {
          message:
            daysUntilExpiry <= 0
              ? 'El calendario macroeconómico y de feriados requiere actualización de datos para el período actual.'
              : `La cobertura del calendario vence en ${daysUntilExpiry} días. Se recomienda sincronizar.`
        }
      : {})
  };
}
