import { DateTime } from 'luxon';
import {
  AgendaDayGroup,
  AgendaKindFilter,
  AgendaTimeRange,
  MarketEvent,
  MarketHoliday,
  MonthCalendarDayCell,
  MonthCalendarGrid,
  TimelineEventMarkerData,
  TodayHolidayItem,
  UnifiedAgendaItem,
  UnifiedEventAgendaItem,
  UnifiedHolidayAgendaItem
} from './types';
import { MARKETS, CHILE_CONFIG } from './markets';
import { CHILE_TZ, isWeekend } from './timezone';
import { MARKET_EVENTS, formatEventTimes } from './events';
import { MARKET_HOLIDAYS } from './holidays';

const MARKET_INFO_LOOKUP: Record<string, { name: string; flag: string; timezone: string }> = {
  [CHILE_CONFIG.id]: {
    name: CHILE_CONFIG.country,
    flag: CHILE_CONFIG.flag,
    timezone: CHILE_CONFIG.timezone
  },
  ...Object.fromEntries(
    MARKETS.map((m) => [m.id, { name: m.name, flag: m.flag, timezone: m.timezone }])
  )
};

function getMarketInfo(marketId: string): { name: string; flag: string; timezone: string } {
  return (
    MARKET_INFO_LOOKUP[marketId] ?? {
      name: marketId.toUpperCase(),
      flag: '🌐',
      timezone: CHILE_TZ
    }
  );
}

function formatRelativeDays(diffDays: number): string {
  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Mañana';
  if (diffDays === -1) return 'Ayer';
  if (diffDays > 1) return `En ${diffDays} días`;
  return `Hace ${Math.abs(diffDays)} días`;
}

function capitalize(str: string): string {
  const clean = str.trim();
  if (!clean) return clean;
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

function formatShortMonth(dt: DateTime): string {
  return capitalize(dt.toFormat('LLL', { locale: 'es' }).replace(/\./g, ''));
}

function formatDayLabel(dt: DateTime): string {
  const weekday = capitalize(dt.toFormat('ccc', { locale: 'es' }).replace(/\./g, ''));
  const month = formatShortMonth(dt);
  return `${weekday} ${dt.day} ${month}`;
}

function computeCloseTimeChile(
  holiday: MarketHoliday,
  marketTimezone: string,
  referenceZone: string = CHILE_TZ
): string | undefined {
  if (!holiday.isEarlyClose || !holiday.closeTime) return undefined;
  const [closeH, closeM] = holiday.closeTime.split(':').map(Number);
  if (!Number.isFinite(closeH) || !Number.isFinite(closeM)) return undefined;

  const holDate = DateTime.fromISO(holiday.date, { zone: marketTimezone }).startOf('day');
  if (!holDate.isValid) return undefined;

  const dtChile = holDate.set({ hour: closeH, minute: closeM }).setZone(referenceZone);
  return `${dtChile.toFormat('HH:mm')} CL`;
}

/**
 * Returns all holidays and early-close sessions matching an ISO calendar date (YYYY-MM-DD),
 * ordered with full closures before early closes, then by marketId.
 */
export function getHolidaysForIsoDate(
  isoDate: string,
  holidays: MarketHoliday[] = MARKET_HOLIDAYS
): TodayHolidayItem[] {
  return holidays
    .filter((h) => h.date === isoDate)
    .map((holiday) => {
      const info = getMarketInfo(holiday.marketId);
      return {
        marketId: holiday.marketId,
        marketName: info.name,
        flag: info.flag,
        holiday
      };
    })
    .sort((a, b) => {
      const earlyDiff = Number(Boolean(a.holiday.isEarlyClose)) - Number(Boolean(b.holiday.isEarlyClose));
      if (earlyDiff !== 0) return earlyDiff;
      return a.marketId.localeCompare(b.marketId);
    });
}

export interface UnifiedAgendaQueryOptions {
  range?: AgendaTimeRange;
  viewedMonth?: { year: number; month: number };
  marketId?: string;
  kind?: AgendaKindFilter;
  onlyHighImportance?: boolean;
  referenceZone?: string;
  events?: MarketEvent[];
  holidays?: MarketHoliday[];
  includePastInCurrentMonth?: boolean;
}

/**
 * Queries and merges macroeconomic events and market holidays into a single
 * chronologically sorted list across a Week, Month, or 90-day window.
 */
export function getUnifiedAgendaItems(
  chileNow: DateTime,
  options: UnifiedAgendaQueryOptions = {}
): UnifiedAgendaItem[] {
  const {
    range = 'week',
    viewedMonth,
    marketId = 'all',
    kind = 'all',
    onlyHighImportance = false,
    referenceZone = CHILE_TZ,
    events = MARKET_EVENTS,
    holidays = MARKET_HOLIDAYS,
    includePastInCurrentMonth = false
  } = options;

  const refToday = chileNow.setZone(referenceZone).startOf('day');
  const todayIso = refToday.toFormat('yyyy-MM-dd');

  let startIso: string;
  let endIso: string;

  if (range === 'week') {
    startIso = todayIso;
    endIso = refToday.plus({ days: 6 }).toFormat('yyyy-MM-dd');
  } else if (range === 'month') {
    const target = viewedMonth ?? { year: refToday.year, month: refToday.month };
    const monthStart = DateTime.fromObject(
      { year: target.year, month: target.month, day: 1 },
      { zone: referenceZone }
    ).startOf('day');
    const monthEnd = monthStart.endOf('month').startOf('day');

    const isCurrentTargetMonth = target.year === refToday.year && target.month === refToday.month;
    startIso = !includePastInCurrentMonth && isCurrentTargetMonth
      ? todayIso
      : monthStart.toFormat('yyyy-MM-dd');
    endIso = monthEnd.toFormat('yyyy-MM-dd');
  } else {
    startIso = todayIso;
    endIso = refToday.plus({ days: 90 }).toFormat('yyyy-MM-dd');
  }

  const items: UnifiedAgendaItem[] = [];

  if (kind !== 'events') {
    for (const holiday of holidays) {
      if (marketId !== 'all' && holiday.marketId !== marketId) continue;
      if (holiday.date < startIso || holiday.date > endIso) continue;

      const info = getMarketInfo(holiday.marketId);
      const holDate = DateTime.fromISO(holiday.date, { zone: referenceZone }).startOf('day');
      const relativeDays = Math.round(holDate.diff(refToday, 'days').days);
      const isEarlyClose = Boolean(holiday.isEarlyClose);
      const closeTimeChile = computeCloseTimeChile(holiday, info.timezone, referenceZone);

      const item: UnifiedHolidayAgendaItem = {
        kind: 'holiday',
        id: `holiday-${holiday.marketId}-${holiday.date}`,
        isoDate: holiday.date,
        marketId: holiday.marketId,
        marketName: info.name,
        marketFlag: info.flag,
        relativeDays,
        relativeDescriptor: formatRelativeDays(relativeDays),
        isEarlyClose,
        holiday,
        ...(closeTimeChile ? { closeTimeChile } : {})
      };

      items.push(item);
    }
  }

  if (kind !== 'holidays') {
    for (const event of events) {
      if (marketId !== 'all' && event.marketId !== marketId) continue;
      if (onlyHighImportance && event.importance !== 'high') continue;

      const eventInRef = DateTime.fromISO(event.timestampUtc, { zone: 'utc' }).setZone(referenceZone);
      if (!eventInRef.isValid) continue;

      const isoDate = eventInRef.toFormat('yyyy-MM-dd');
      if (isoDate < startIso || isoDate > endIso) continue;

      const info = getMarketInfo(event.marketId);
      const relativeDays = Math.round(eventInRef.startOf('day').diff(refToday, 'days').days);
      const minuteInChile = eventInRef.hour * 60 + eventInRef.minute;
      const formatted = formatEventTimes(event, chileNow, referenceZone);

      const item: UnifiedEventAgendaItem = {
        kind: 'event',
        id: event.id,
        isoDate,
        marketId: event.marketId,
        marketName: info.name,
        marketFlag: info.flag,
        relativeDays,
        relativeDescriptor: formatRelativeDays(relativeDays),
        minuteInChile,
        event: formatted
      };

      items.push(item);
    }
  }

  return items.sort((a, b) => {
    const dateDiff = a.isoDate.localeCompare(b.isoDate);
    if (dateDiff !== 0) return dateDiff;

    if (a.kind !== b.kind) {
      return a.kind === 'holiday' ? -1 : 1;
    }

    if (a.kind === 'holiday' && b.kind === 'holiday') {
      const earlyDiff = Number(a.isEarlyClose) - Number(b.isEarlyClose);
      if (earlyDiff !== 0) return earlyDiff;
    } else if (a.kind === 'event' && b.kind === 'event') {
      const minuteDiff = a.minuteInChile - b.minuteInChile;
      if (minuteDiff !== 0) return minuteDiff;
    }

    const marketDiff = a.marketId.localeCompare(b.marketId);
    if (marketDiff !== 0) return marketDiff;

    return a.id.localeCompare(b.id);
  });
}

/**
 * Groups unified agenda items into per-day sections sorted chronologically.
 */
export function groupAgendaItemsByDate(
  items: UnifiedAgendaItem[],
  chileNow: DateTime,
  referenceZone: string = CHILE_TZ
): AgendaDayGroup[] {
  const refToday = chileNow.setZone(referenceZone).startOf('day');
  const buckets = new Map<string, { holidays: UnifiedHolidayAgendaItem[]; events: UnifiedEventAgendaItem[] }>();

  for (const item of items) {
    let bucket = buckets.get(item.isoDate);
    if (!bucket) {
      bucket = { holidays: [], events: [] };
      buckets.set(item.isoDate, bucket);
    }
    if (item.kind === 'holiday') {
      bucket.holidays.push(item);
    } else {
      bucket.events.push(item);
    }
  }

  const sortedDates = Array.from(buckets.keys()).sort((a, b) => a.localeCompare(b));

  return sortedDates.map((isoDate) => {
    const bucket = buckets.get(isoDate)!;
    const dayDt = DateTime.fromISO(isoDate, { zone: referenceZone }).startOf('day');
    const relativeDays = Math.round(dayDt.diff(refToday, 'days').days);

    return {
      isoDate,
      dayLabel: formatDayLabel(dayDt),
      relativeDescriptor: formatRelativeDays(relativeDays),
      relativeDays,
      isToday: relativeDays === 0,
      isWeekend: isWeekend(dayDt),
      holidays: bucket.holidays,
      events: bucket.events,
      totalCount: bucket.holidays.length + bucket.events.length,
      hasHighImpact: bucket.events.some((e) => e.event.importance === 'high'),
      hasFullHoliday: bucket.holidays.some((h) => !h.isEarlyClose),
      hasEarlyClose: bucket.holidays.some((h) => h.isEarlyClose)
    };
  });
}

/**
 * Builds a Monday-first calendar grid for a target month, aggregating per-day
 * holiday, early-close, high-impact, and medium-impact event counts.
 */
export function buildMonthCalendarGrid(
  year: number,
  month: number,
  chileNow: DateTime,
  monthItems: UnifiedAgendaItem[],
  referenceZone: string = CHILE_TZ
): MonthCalendarGrid {
  const refToday = chileNow.setZone(referenceZone).startOf('day');
  const todayIso = refToday.toFormat('yyyy-MM-dd');

  const monthStart = DateTime.fromObject({ year, month, day: 1 }, { zone: referenceZone }).startOf('day');
  const monthEnd = monthStart.endOf('month').startOf('day');

  // Monday-first offset (Luxon weekday: 1=Mon .. 7=Sun)
  const leadingDays = monthStart.weekday - 1;
  const trailingDays = 7 - monthEnd.weekday;
  const gridStart = monthStart.minus({ days: leadingDays });
  const gridEnd = monthEnd.plus({ days: trailingDays });

  const countsByIso = new Map<
    string,
    { holidayCount: number; earlyCloseCount: number; highImpactCount: number; mediumImpactCount: number }
  >();

  for (const item of monthItems) {
    let counts = countsByIso.get(item.isoDate);
    if (!counts) {
      counts = { holidayCount: 0, earlyCloseCount: 0, highImpactCount: 0, mediumImpactCount: 0 };
      countsByIso.set(item.isoDate, counts);
    }

    if (item.kind === 'holiday') {
      if (item.isEarlyClose) {
        counts.earlyCloseCount += 1;
      } else {
        counts.holidayCount += 1;
      }
    } else if (item.event.importance === 'high') {
      counts.highImpactCount += 1;
    } else {
      counts.mediumImpactCount += 1;
    }
  }

  const cells: MonthCalendarDayCell[] = [];
  let cursor = gridStart;

  while (cursor <= gridEnd) {
    const isoDate = cursor.toFormat('yyyy-MM-dd');
    const counts = countsByIso.get(isoDate) ?? {
      holidayCount: 0,
      earlyCloseCount: 0,
      highImpactCount: 0,
      mediumImpactCount: 0
    };

    cells.push({
      isoDate,
      dayOfMonth: cursor.day,
      isCurrentMonth: cursor.year === year && cursor.month === month,
      isToday: isoDate === todayIso,
      isPast: cursor < refToday,
      holidayCount: counts.holidayCount,
      earlyCloseCount: counts.earlyCloseCount,
      highImpactCount: counts.highImpactCount,
      mediumImpactCount: counts.mediumImpactCount,
      totalCount:
        counts.holidayCount +
        counts.earlyCloseCount +
        counts.highImpactCount +
        counts.mediumImpactCount
    });

    cursor = cursor.plus({ days: 1 });
  }

  return {
    year,
    month,
    monthLabel: capitalize(monthStart.toFormat('LLLL yyyy', { locale: 'es' })),
    cells
  };
}

/**
 * Formats a human-readable Spanish label for the active agenda range.
 */
export function getRangeWindowLabel(
  range: AgendaTimeRange,
  chileNow: DateTime,
  viewedMonth?: { year: number; month: number },
  referenceZone: string = CHILE_TZ
): string {
  const refToday = chileNow.setZone(referenceZone).startOf('day');

  if (range === 'week') {
    const end = refToday.plus({ days: 6 });
    return `${refToday.day} ${formatShortMonth(refToday)} – ${end.day} ${formatShortMonth(end)}`;
  }

  if (range === 'month') {
    const target = viewedMonth ?? { year: refToday.year, month: refToday.month };
    const monthStart = DateTime.fromObject(
      { year: target.year, month: target.month, day: 1 },
      { zone: referenceZone }
    );
    return capitalize(monthStart.toFormat('LLLL yyyy', { locale: 'es' }));
  }

  return 'Próximos 90 días';
}

export interface UpcomingStripPreview {
  weekItemsAfterToday: UnifiedAgendaItem[];
  nextUpcomingItem?: UnifiedAgendaItem;
}

/**
 * Computes look-ahead items for the main dashboard strip:
 * - Items in the next 6 days after today (`relativeDays >= 1`)
 * - If the rest of the week is empty, falls back to the nearest future item in 90 days.
 */
export function getUpcomingStripPreview(
  chileNow: DateTime,
  options: {
    referenceZone?: string;
    events?: MarketEvent[];
    holidays?: MarketHoliday[];
  } = {}
): UpcomingStripPreview {
  const weekItemsAfterToday = getUnifiedAgendaItems(chileNow, {
    range: 'week',
    referenceZone: options.referenceZone,
    events: options.events,
    holidays: options.holidays
  }).filter((item) => item.relativeDays >= 1);

  if (weekItemsAfterToday.length > 0) {
    return { weekItemsAfterToday };
  }

  const nextUpcomingItem = getUnifiedAgendaItems(chileNow, {
    range: 'quarter',
    referenceZone: options.referenceZone,
    events: options.events,
    holidays: options.holidays
  }).find((item) => item.relativeDays >= 1);

  return {
    weekItemsAfterToday,
    ...(nextUpcomingItem ? { nextUpcomingItem } : {})
  };
}

/**
 * Converts a UnifiedEventAgendaItem into a TimelineEventMarkerData payload
 * compatible with EventDetailModal.
 */
export function toTimelineEventMarkerData(item: UnifiedEventAgendaItem): TimelineEventMarkerData {
  return {
    ...item.event,
    minuteInChile: item.minuteInChile,
    leftPercent: (item.minuteInChile / 1440) * 100
  };
}
