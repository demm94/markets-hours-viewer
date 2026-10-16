import { DateTime } from 'luxon';
import {
  MarketEvent,
  FormattedMarketEvent,
  EventImportance,
  EventCategory,
  TimelineEventMarkerData,
  RollingDayInfo
} from './types';
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
  const maxDays = options.maxDaysAhead ?? 120;
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

export function getRollingDaysWindow(
  referenceDate: DateTime = DateTime.now().setZone(CHILE_CONFIG.timezone),
  daysCount: number = 7,
  events: MarketEvent[] = MARKET_EVENTS
): RollingDayInfo[] {
  const chileNow = referenceDate.setZone(CHILE_CONFIG.timezone);
  const startOfChileToday = chileNow.startOf('day');
  const result: RollingDayInfo[] = [];

  for (let i = 0; i < daysCount; i++) {
    const targetDay = startOfChileToday.plus({ days: i });
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
      const eventInChile = DateTime.fromISO(e.timestampUtc, { zone: 'utc' }).setZone(CHILE_CONFIG.timezone);
      return eventInChile >= targetDay && eventInChile < nextDay;
    });

    const eventCount = dayEvents.length;
    const hasEvents = eventCount > 0;
    const hasHighImpact = dayEvents.some((e) => e.importance === 'high');

    result.push({
      date: targetDay,
      isoDate,
      label,
      dayOfWeekShort,
      dayOfMonth,
      isToday,
      hasEvents,
      eventCount,
      hasHighImpact
    });
  }

  return result;
}

/**
 * Accurately infers the macroeconomic category for an event title using word boundaries and domain precedence.
 */
export function inferCategory(eventTitle: string): EventCategory {
  const text = (eventTitle || '').toLowerCase();

  // 1. Employment (higher specificity: unemployment, nonfarm payrolls, jobless claims)
  if (
    /\b(unemployment|payroll|payrolls|jobless|employment|desempleo|empleo|labor force|labor market|non-?farm|adp|jolts)\b/.test(
      text
    )
  ) {
    return 'employment';
  }

  // 2. Inflation (cpi, ppi, pce, inflation, price index, ipc, deflator)
  // Ensure "shipping" or "clipping" does not trigger "ppi"
  if (
    /\b(cpi|ipc|inflation|inflaci[oó]n|price index|\bppi\b|\bpce\b|deflator|cost of living)\b/.test(
      text
    )
  ) {
    return 'inflation';
  }

  // 3. Central Bank (rates, FOMC, Fed meetings, monetary policy, repo rate)
  // Ensure "confederation" does not trigger "fed"
  if (
    /\b(interest rate|policy rate|loan prime rate|fomc|federal reserve|\bfed\b|\bpboc\b|central bank|banco central|monetary policy|pol[ií]tica monetaria|\brpm\b|\blpr\b|repo rate|tasa de inter[eé]s|discount rate|target rate|rate decision|decisi[oó]n de tasa|decisi[oó]n tasa)\b/.test(
      text
    )
  ) {
    return 'central_bank';
  }

  // 4. Growth, Output & Trade (GDP, PIB, PMI, Retail, Industrial Production, Trade Balance)
  if (
    /\b(gdp|pib|growth|trade balance|balanza comercial|industrial production|producci[oó]n industrial|retail sales|ventas minoristas|pmi|ism|manufacturing|servicios|current account)\b/.test(
      text
    )
  ) {
    return 'gdp';
  }

  // 5. Holidays
  if (/\b(holiday|feriado|closure|festivo)\b/.test(text)) {
    return 'holidays';
  }

  return 'gdp';
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
  chileNow: DateTime = DateTime.now().setZone(CHILE_CONFIG.timezone)
): DataFreshnessStatus {
  const latestEventUtc =
    MARKET_EVENTS.length > 0
      ? MARKET_EVENTS.reduce(
          (max, e) => (e.timestampUtc > max ? e.timestampUtc : max),
          MARKET_EVENTS[0].timestampUtc
        )
      : '2026-01-01';

  const latestEventDate = DateTime.fromISO(latestEventUtc, { zone: 'America/Santiago' });
  const daysUntilExpiry = Math.round(latestEventDate.diff(chileNow, 'days').days);
  const isStale = daysUntilExpiry <= 14;

  return {
    latestEventDateStr: latestEventDate.toFormat('yyyy-MM-dd'),
    isStale,
    daysUntilExpiry,
    ...(isStale
      ? {
          message:
            daysUntilExpiry <= 0
              ? 'El calendario macroeconómico requiere actualización de datos para el período actual.'
              : `La cobertura del calendario vence en ${daysUntilExpiry} días. Se recomienda sincronizar.`
        }
      : {})
  };
}
