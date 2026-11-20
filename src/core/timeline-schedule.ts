import { formatMinutes } from './timezone';
import { MarketConfig, MarketEvaluation, TimelineEventMarkerData, TimelineSegment } from './types';

export type TimelineDaySummaryKind = 'hours' | 'open_only' | 'close_only' | 'holiday' | 'closed';

export interface TimelineDaySummary {
  label: string;
  kind: TimelineDaySummaryKind;
  isEarlyClose: boolean;
  holidayName?: string;
  hasLunchBreak: boolean;
}

function formatMinuteBoundary(minute: number): string {
  if (minute >= 1440) return '24:00';
  return formatMinutes(minute);
}

function isFullHolidaySegment(segment: TimelineSegment): boolean {
  return Boolean(segment.holiday && !segment.holiday.isEarlyClose);
}

/**
 * Summarizes a market's 24-hour Chile-time segments for a selected day into a compact
 * open–close label (reconstructing overnight sessions that wrap across midnight).
 */
export function summarizeTimelineDaySegments(segments: TimelineSegment[]): TimelineDaySummary {
  if (segments.length === 0) {
    return {
      label: 'Cerrado',
      kind: 'closed',
      isEarlyClose: false,
      hasLunchBreak: false
    };
  }

  if (segments.every(isFullHolidaySegment)) {
    return {
      label: 'Feriado',
      kind: 'holiday',
      isEarlyClose: false,
      ...(segments[0]?.holiday?.name ? { holidayName: segments[0].holiday.name } : {}),
      hasLunchBreak: false
    };
  }

  const activeTrading = segments
    .filter((s) => !isFullHolidaySegment(s) && (s.type === 'regular' || s.type === 'lunch'))
    .sort((a, b) => a.startMinute - b.startMinute);

  const hasLunchBreak = activeTrading.some((s) => s.type === 'lunch');
  const earlyCloseSeg = activeTrading.find((s) => s.type === 'regular' && Boolean(s.holiday?.isEarlyClose));
  const isEarlyClose = Boolean(earlyCloseSeg);
  const holidayName = earlyCloseSeg?.holiday?.name;

  const blocks: { start: number; end: number; hasRegular: boolean }[] = [];
  for (const seg of activeTrading) {
    const prev = blocks[blocks.length - 1];
    if (prev && seg.startMinute <= prev.end) {
      prev.end = Math.max(prev.end, seg.endMinute);
      if (seg.type === 'regular') {
        prev.hasRegular = true;
      }
    } else {
      blocks.push({
        start: seg.startMinute,
        end: seg.endMinute,
        hasRegular: seg.type === 'regular'
      });
    }
  }

  const regularBlocks = blocks.filter((b) => b.hasRegular);
  if (regularBlocks.length === 0) {
    return {
      label: 'Cerrado',
      kind: 'closed',
      isEarlyClose: false,
      hasLunchBreak: false
    };
  }

  const meta = {
    isEarlyClose,
    ...(holidayName ? { holidayName } : {}),
    hasLunchBreak
  };

  if (regularBlocks.length === 1) {
    const [b] = regularBlocks;
    if (b.start === 0 && b.end === 1440) {
      return { label: '00:00–24:00', kind: 'hours', ...meta };
    }
    if (b.start === 0) {
      return { label: `00:00–${formatMinutes(b.end)}`, kind: 'close_only', ...meta };
    }
    if (b.end === 1440) {
      return { label: `${formatMinutes(b.start)}–24:00`, kind: 'open_only', ...meta };
    }
    return { label: `${formatMinutes(b.start)}–${formatMinutes(b.end)}`, kind: 'hours', ...meta };
  }

  const first = regularBlocks[0];
  const last = regularBlocks[regularBlocks.length - 1];
  if (first.start === 0 && last.end === 1440) {
    return {
      label: `${formatMinutes(last.start)}–${formatMinutes(first.end)}`,
      kind: 'hours',
      ...meta
    };
  }

  return {
    label: regularBlocks
      .map((b) => `${formatMinutes(b.start)}–${formatMinuteBoundary(b.end)}`)
      .join(' · '),
    kind: 'hours',
    ...meta
  };
}

/**
 * Resolves the timeline left-column sublabel for a market: shows a live countdown
 * (e.g. "Cierra en 2h 15m") while active on Today, or unambiguous Chile hours when closed/future.
 */
export function getTimelineLeftColumnSublabel(
  summary: TimelineDaySummary,
  liveEvaluation: MarketEvaluation | undefined,
  showLiveStatus: boolean
): string {
  if (
    showLiveStatus &&
    summary.kind !== 'holiday' &&
    liveEvaluation &&
    liveEvaluation.status !== 'closed' &&
    liveEvaluation.nextTransition?.formattedCountdown
  ) {
    return liveEvaluation.nextTransition.formattedCountdown;
  }
  return summary.label;
}

/**
 * Formats an individual regular session bar's inline Chile-time label.
 */
export function formatSegmentBarLabel(segment: TimelineSegment): string {
  if (segment.startMinute === 0 && segment.endMinute === 1440) {
    return '00:00–24:00';
  }
  if (segment.startMinute === 0) {
    return `→ ${formatMinuteBoundary(segment.endMinute)}`;
  }
  if (segment.endMinute === 1440) {
    return `${formatMinutes(segment.startMinute)} →`;
  }
  return `${formatMinutes(segment.startMinute)}–${formatMinuteBoundary(segment.endMinute)}`;
}

/**
 * Builds a clear Chile-time hover tooltip for any timeline segment.
 */
export function getSegmentTooltip(marketName: string, segment: TimelineSegment): string {
  if (isFullHolidaySegment(segment)) {
    return `${marketName} · Feriado: ${segment.holiday!.name}`;
  }

  const range = `${formatMinutes(segment.startMinute)}–${formatMinuteBoundary(segment.endMinute)} CL`;
  if (segment.holiday?.isEarlyClose) {
    return `${marketName} · Cierre temprano (${segment.holiday.name}): ${range}`;
  }
  if (segment.type === 'lunch') {
    return `${marketName} · Almuerzo: ${range}`;
  }
  if (segment.type === 'pre_market') {
    return `${marketName} · Pre-apertura: ${range}`;
  }
  return `${marketName} · Abierto: ${range}`;
}

/**
 * Determines whether an inline open–close time label fits inside a regular session bar
 * without colliding with event pins.
 */
export function canShowInlineBarLabel(
  segment: TimelineSegment,
  marketEvents: TimelineEventMarkerData[] = []
): { desktop: boolean; mobile: boolean } {
  if (segment.type !== 'regular' || isFullHolidaySegment(segment)) {
    return { desktop: false, mobile: false };
  }

  const segStartPct = (segment.startMinute / 1440) * 100;
  const segEndPct = (segment.endMinute / 1440) * 100;
  const widthPct = segEndPct - segStartPct;
  const centerPct = (segStartPct + segEndPct) / 2;

  const hasCollision = marketEvents.some(
    (evt) =>
      Math.abs(evt.leftPercent - centerPct) < 6.5 ||
      (widthPct < 18 && evt.leftPercent >= segStartPct - 1 && evt.leftPercent <= segEndPct + 1)
  );

  if (hasCollision) {
    return { desktop: false, mobile: false };
  }

  return {
    desktop: widthPct >= 8,
    mobile: widthPct >= 14
  };
}

/**
 * Flattens and sorts all events for a selected day across all markets (including Chile)
 * by Chile minute ascending, prioritizing high-impact events on ties.
 */
export function getSelectedDayEventsList(
  dailyEvents: Record<string, TimelineEventMarkerData[]> = {}
): TimelineEventMarkerData[] {
  return Object.values(dailyEvents)
    .flat()
    .sort((a, b) => {
      if (a.minuteInChile !== b.minuteInChile) {
        return a.minuteInChile - b.minuteInChile;
      }
      const impA = a.importance === 'high' ? 0 : 1;
      const impB = b.importance === 'high' ? 0 : 1;
      if (impA !== impB) {
        return impA - impB;
      }
      return a.title.localeCompare(b.title);
    });
}

/**
 * Formats a minute duration cleanly (e.g. "6h 30m", "2h", "45m").
 */
export function formatDurationMinutes(minutes: number): string {
  const safe = Math.max(0, Math.round(minutes));
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/**
 * Maps a pointer horizontal clientX inside container bounds to a clamped [0, 1440] minute
 * snapped to 5-minute increments. Returns null for degenerate zero-width containers.
 */
export function clampTimelineMinuteFromPointer(
  clientX: number,
  rectLeft: number,
  rectWidth: number
): number | null {
  if (rectWidth <= 0) return null;
  const ratio = Math.max(0, Math.min(1, (clientX - rectLeft) / rectWidth));
  const snapped = Math.round((ratio * 1440) / 5) * 5;
  return Math.max(0, Math.min(1440, snapped));
}

export interface TimelineHourSnapshot {
  minute: number;
  timeLabel: string;
  openMarkets: MarketConfig[];
  lunchMarkets: MarketConfig[];
  preMarketMarkets: MarketConfig[];
  activeMarketIds: string[];
}

/**
 * Summarizes which markets are open, on lunch break, or in pre-market at a given Chile minute.
 * Excludes full-holiday segments.
 */
export function getTimelineActivityAtMinute(
  minute: number,
  markets: MarketConfig[],
  marketSegments: Record<string, TimelineSegment[]>
): TimelineHourSnapshot {
  const clamped = Math.max(0, Math.min(1440, Math.round(minute)));
  const openMarkets: MarketConfig[] = [];
  const lunchMarkets: MarketConfig[] = [];
  const preMarketMarkets: MarketConfig[] = [];
  const activeMarketIds: string[] = [];

  for (const market of markets) {
    const segments = marketSegments[market.id] ?? [];
    const matching = segments.filter((seg) => {
      if (isFullHolidaySegment(seg)) return false;
      if (clamped === 1440) return seg.endMinute === 1440;
      return clamped >= seg.startMinute && clamped < seg.endMinute;
    });

    if (matching.length === 0) continue;

    const regular = matching.find((s) => s.type === 'regular');
    const lunch = matching.find((s) => s.type === 'lunch');
    const pre = matching.find((s) => s.type === 'pre_market');

    if (regular) {
      openMarkets.push(market);
      activeMarketIds.push(market.id);
    } else if (lunch) {
      lunchMarkets.push(market);
      activeMarketIds.push(market.id);
    } else if (pre) {
      preMarketMarkets.push(market);
      activeMarketIds.push(market.id);
    }
  }

  return {
    minute: clamped,
    timeLabel: `${formatMinuteBoundary(clamped)} CL`,
    openMarkets,
    lunchMarkets,
    preMarketMarkets,
    activeMarketIds
  };
}

/**
 * Formats a single-line Chile-time inspection label for an active or hovered session bar.
 */
export function formatSegmentInspectionText(market: MarketConfig, segment: TimelineSegment): string {
  const prefix = `${market.flag} ${market.name}`;
  if (isFullHolidaySegment(segment)) {
    return `${prefix} · Feriado: ${segment.holiday!.name}`;
  }

  const range = `${formatMinutes(segment.startMinute)}–${formatMinuteBoundary(segment.endMinute)} CL`;
  const duration = formatDurationMinutes(segment.endMinute - segment.startMinute);

  if (segment.holiday?.isEarlyClose) {
    return `${prefix} · Cierre temprano ${range} (${duration}) · ${segment.holiday.name}`;
  }
  if (segment.type === 'lunch') {
    return `${prefix} · Almuerzo ${range} (${duration})`;
  }
  if (segment.type === 'pre_market') {
    return `${prefix} · Pre-apertura ${range} (${duration})`;
  }
  return `${prefix} · ${range} (${duration})`;
}
