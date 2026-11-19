import { DateTime } from 'luxon';
import {
  MarketConfig,
  MarketEvaluation,
  MarketEvent,
  LiveStatusSummary,
  TodayAgendaSummary,
  TodayHolidayItem,
  UpcomingBell
} from './types';
import { CHILE_CONFIG } from './markets';
import { CHILE_TZ } from './timezone';
import { getMarketHoliday } from './holidays';
import { getEventsForChileDay, MARKET_EVENTS } from './events';

/**
 * Summarizes live market status across all tracked exchanges and identifies
 * the nearest upcoming bell (open, close, lunch, or resume) in Chile time.
 */
export function getLiveStatusSummary(
  markets: MarketConfig[],
  evaluations: Record<string, MarketEvaluation>
): LiveStatusSummary {
  const openMarkets: MarketConfig[] = [];
  const lunchMarkets: MarketConfig[] = [];
  const preMarketMarkets: MarketConfig[] = [];

  let nextBell: UpcomingBell | undefined;

  for (const market of markets) {
    const ev = evaluations[market.id];
    if (!ev) continue;

    if (ev.status === 'open') {
      openMarkets.push(market);
    } else if (ev.status === 'lunch') {
      lunchMarkets.push(market);
    } else if (ev.status === 'pre_market') {
      preMarketMarkets.push(market);
    }

    if (ev.nextTransition) {
      const candidate: UpcomingBell = {
        market,
        type: ev.nextTransition.type,
        inMinutes: ev.nextTransition.inMinutes,
        formattedCountdown: ev.nextTransition.formattedCountdown,
        atChileFormatted: ev.nextTransition.atChileFormatted ?? ''
      };

      if (!nextBell || candidate.inMinutes < nextBell.inMinutes) {
        nextBell = candidate;
      }
    }
  }

  const isGlobalWeekend =
    markets.length > 0 &&
    markets.every((m) => {
      const ev = evaluations[m.id];
      return ev?.status === 'closed' && ev.activeSegmentLabel === 'Fin de semana';
    });

  return {
    openMarkets,
    lunchMarkets,
    preMarketMarkets,
    isGlobalWeekend,
    nextBell
  };
}

/**
 * Aggregates today's actionable agenda items (holidays, early closes, and macro events)
 * directly for the main screen without requiring the user to open drawers.
 */
export function getTodayAgenda(
  markets: MarketConfig[],
  referenceDate: DateTime = DateTime.now().setZone(CHILE_TZ),
  referenceZone: string = CHILE_TZ,
  events: MarketEvent[] = MARKET_EVENTS
): TodayAgendaSummary {
  const refChile = referenceDate.setZone(referenceZone);
  const holidays: TodayHolidayItem[] = [];
  const earlyCloses: TodayHolidayItem[] = [];

  const checkEntities = [
    ...markets.map((m) => ({ id: m.id, name: m.name, flag: m.flag, timezone: m.timezone })),
    { id: CHILE_CONFIG.id, name: CHILE_CONFIG.country, flag: CHILE_CONFIG.flag, timezone: referenceZone }
  ];

  for (const entity of checkEntities) {
    const localDateStr = refChile.setZone(entity.timezone).toFormat('yyyy-MM-dd');
    const holiday = getMarketHoliday(entity.id, localDateStr);
    if (!holiday) continue;

    const item: TodayHolidayItem = {
      marketId: entity.id,
      marketName: entity.name,
      flag: entity.flag,
      holiday
    };

    if (holiday.isEarlyClose) {
      earlyCloses.push(item);
    } else {
      holidays.push(item);
    }
  }

  const eventsByMarket = getEventsForChileDay(refChile, events, referenceZone);
  const flatEvents = Object.values(eventsByMarket)
    .flat()
    .sort((a, b) => a.minuteInChile - b.minuteInChile);

  const highImpactCount = flatEvents.filter((e) => e.importance === 'high').length;
  const hasItems = holidays.length > 0 || earlyCloses.length > 0 || flatEvents.length > 0;

  return {
    holidays,
    earlyCloses,
    events: flatEvents,
    highImpactCount,
    hasItems
  };
}
