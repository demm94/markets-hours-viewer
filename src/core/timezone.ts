import { DateTime } from 'luxon';
import { MarketConfig, MarketEvaluation, MarketStatus, TimelineSegment } from './types';
import { CHILE_CONFIG } from './markets';

export const CHILE_TZ = CHILE_CONFIG.timezone; // 'America/Santiago'

/**
 * Parses "HH:mm" into hour and minute numbers.
 */
export function parseTime(timeStr: string): { hour: number; minute: number } {
  const [h, m] = timeStr.split(':').map(Number);
  return { hour: h, minute: m };
}

/**
 * Projects a market's trading sessions onto a 24-hour reference timeline for Chile.
 * Examines surrounding calendar days in the market's timezone to handle day-wrap effects.
 */
export function projectMarketToTimeline(
  market: MarketConfig,
  referenceDate: DateTime = DateTime.now().setZone(CHILE_TZ)
): TimelineSegment[] {
  const refDayStart = referenceDate.setZone(CHILE_TZ).startOf('day');
  const refDayEnd = refDayStart.plus({ days: 1 });

  const segments: TimelineSegment[] = [];

  // Inspect days around the reference day to capture sessions that cross midnight in Chile
  const daysToCheck = [-1, 0, 1];

  for (const dayOffset of daysToCheck) {
    const targetDay = refDayStart.plus({ days: dayOffset }).setZone(market.timezone);

    for (const session of market.sessions) {
      const { hour: startH, minute: startM } = parseTime(session.start);
      const { hour: endH, minute: endM } = parseTime(session.end);

      const sessionStartMarket = DateTime.fromObject(
        {
          year: targetDay.year,
          month: targetDay.month,
          day: targetDay.day,
          hour: startH,
          minute: startM,
          second: 0
        },
        { zone: market.timezone }
      );

      const sessionEndMarket = DateTime.fromObject(
        {
          year: targetDay.year,
          month: targetDay.month,
          day: targetDay.day,
          hour: endH,
          minute: endM,
          second: 0
        },
        { zone: market.timezone }
      );

      // Convert session to Chile reference time
      const sessionStartChile = sessionStartMarket.setZone(CHILE_TZ);
      const sessionEndChile = sessionEndMarket.setZone(CHILE_TZ);

      // Check overlap with reference day [refDayStart, refDayEnd)
      if (sessionEndChile <= refDayStart || sessionStartChile >= refDayEnd) {
        continue;
      }

      // Clip to reference day boundaries
      const clippedStart = sessionStartChile < refDayStart ? refDayStart : sessionStartChile;
      const clippedEnd = sessionEndChile > refDayEnd ? refDayEnd : sessionEndChile;

      const startMinute = Math.round(clippedStart.diff(refDayStart, 'minutes').minutes);
      const endMinute = Math.round(clippedEnd.diff(refDayStart, 'minutes').minutes);

      if (endMinute > startMinute) {
        segments.push({
          type: session.type,
          startMinute,
          endMinute,
          label: session.label
        });
      }
    }
  }

  // Sort segments by start minute
  return segments.sort((a, b) => a.startMinute - b.startMinute);
}

/**
 * Evaluates the status and local time of a market at a specific instant.
 */
export function evaluateMarketAt(
  market: MarketConfig,
  instant: DateTime
): MarketEvaluation {
  const localTime = instant.setZone(market.timezone);

  let status: MarketStatus = 'closed';
  let activeSegmentLabel: string | undefined;

  for (const session of market.sessions) {
    const { hour: startH, minute: startM } = parseTime(session.start);
    const { hour: endH, minute: endM } = parseTime(session.end);

    const sessionStart = localTime.set({
      hour: startH,
      minute: startM,
      second: 0,
      millisecond: 0
    });

    const sessionEnd = localTime.set({
      hour: endH,
      minute: endM,
      second: 0,
      millisecond: 0
    });

    if (localTime >= sessionStart && localTime < sessionEnd) {
      status = session.type === 'regular' ? 'open' : session.type;
      activeSegmentLabel = session.label;
      break;
    }
  }

  return {
    marketId: market.id,
    status,
    localTimeFormatted: localTime.toFormat('HH:mm'),
    localDateFormatted: localTime.toFormat('ccc d MMM'),
    activeSegmentLabel
  };
}

/**
 * Converts a minute offset (0-1440) on the reference day to a DateTime in Santiago.
 */
export function minuteOffsetToDateTime(
  minuteOffset: number,
  referenceDate: DateTime = DateTime.now().setZone(CHILE_TZ)
): DateTime {
  const refDayStart = referenceDate.setZone(CHILE_TZ).startOf('day');
  return refDayStart.plus({ minutes: minuteOffset });
}

/**
 * Formats a minute offset (0-1440) as "HH:mm".
 */
export function formatMinutes(minuteOffset: number): string {
  const clamped = Math.max(0, Math.min(1440, minuteOffset));
  const h = Math.floor(clamped / 60) % 24;
  const m = Math.floor(clamped % 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/**
 * Returns human-readable Santiago UTC offset string.
 */
export function getSantiagoOffsetDescription(date: DateTime = DateTime.now().setZone(CHILE_TZ)): string {
  const santiago = date.setZone(CHILE_TZ);
  const offsetHours = santiago.offset / 60;
  const sign = offsetHours >= 0 ? '+' : '';
  const isDst = santiago.isInDST;
  const name = isDst ? 'Horario de Verano' : 'Horario Estándar';
  return `UTC${sign}${offsetHours} (${name})`;
}
