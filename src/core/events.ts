import { DateTime } from 'luxon';
import { MarketEvent, FormattedMarketEvent, EventImportance, TimelineEventMarkerData } from './types';
import { MARKETS, CHILE_CONFIG } from './markets';

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
}

export function formatEventTimes(event: MarketEvent, chileNow: DateTime): FormattedMarketEvent {
  const eventUtc = DateTime.fromISO(event.timestampUtc, { zone: 'utc' });
  const eventInChile = eventUtc.setZone('America/Santiago');
  const marketZone = MARKET_TIMEZONE_MAP[event.marketId] || 'America/Santiago';
  const eventInMarket = eventUtc.setZone(marketZone);

  // Calculate day difference relative to Chilean local day
  const chileStartToday = chileNow.startOf('day');
  const eventStartDay = eventInChile.startOf('day');
  const diffDays = Math.round(eventStartDay.diff(chileStartToday, 'days').days);

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
    chileTimeFormatted: `${eventInChile.toFormat('HH:mm')} (${eventInChile.toFormat('d LLL', { locale: 'es' })})`,
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

  // Filter out events older than 24h prior to chileNow
  const cutoffPast = chileNow.minus({ hours: 24 });
  const maxDays = options.maxDaysAhead ?? 30;
  const cutoffFuture = chileNow.plus({ days: maxDays });

  return filtered
    .filter((e) => {
      const t = DateTime.fromISO(e.timestampUtc, { zone: 'utc' });
      return t >= cutoffPast && t <= cutoffFuture;
    })
    .sort((a, b) => a.timestampUtc.localeCompare(b.timestampUtc))
    .map((e) => formatEventTimes(e, chileNow));
}

export function hasHighImpactEventsToday(marketId: string, chileNow: DateTime): boolean {
  const todayChileStr = chileNow.toFormat('yyyy-MM-dd');
  return MARKET_EVENTS.some((e) => {
    if (e.marketId !== marketId) return false;
    if (e.importance !== 'high') return false;
    const eventInChile = DateTime.fromISO(e.timestampUtc, { zone: 'utc' }).setZone('America/Santiago');
    return eventInChile.toFormat('yyyy-MM-dd') === todayChileStr;
  });
}

export function getEventsForChileDay(
  referenceDate: DateTime = DateTime.now().setZone(CHILE_CONFIG.timezone),
  events: MarketEvent[] = MARKET_EVENTS
): Record<string, TimelineEventMarkerData[]> {
  const chileDate = referenceDate.setZone(CHILE_CONFIG.timezone);
  const chileStartToday = chileDate.startOf('day');
  const chileEndToday = chileStartToday.plus({ days: 1 });

  const result: Record<string, TimelineEventMarkerData[]> = {};

  for (const event of events) {
    const eventUtc = DateTime.fromISO(event.timestampUtc, { zone: 'utc' });
    const eventInChile = eventUtc.setZone(CHILE_CONFIG.timezone);

    if (eventInChile >= chileStartToday && eventInChile < chileEndToday) {
      const minuteInChile = eventInChile.hour * 60 + eventInChile.minute;
      const leftPercent = (minuteInChile / 1440) * 100;
      const formatted = formatEventTimes(event, chileDate);

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
