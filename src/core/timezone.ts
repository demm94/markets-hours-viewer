import { DateTime } from 'luxon';
import { MarketConfig, MarketEvaluation, MarketStatus, TimelineSegment, MarketTransition } from './types';
import { CHILE_CONFIG } from './markets';
import { getMarketHoliday, isMarketHoliday } from './holidays';

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

      const startMinute = dateTimeToWallClockMinutes(clippedStart, referenceDate);
      const endMinute = dateTimeToWallClockMinutes(clippedEnd, referenceDate);

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
 * Checks whether a given DateTime falls on a weekend (Saturday or Sunday).
 */
export function isWeekend(dateTime: DateTime): boolean {
  return dateTime.weekday === 6 || dateTime.weekday === 7;
}

export interface EvaluateMarketOptions {
  isSimulation?: boolean;
}

/**
 * Formats a duration in minutes into a human readable countdown string (e.g. "45m", "1h 20m", "4d 10h 58m").
 */
export function formatMinutesCountdown(minutesRemaining: number): string {
  const m = Math.max(0, Math.round(minutesRemaining));
  if (m < 60) {
    return `${m}m`;
  }

  const days = Math.floor(m / 1440);
  const hours = Math.floor((m % 1440) / 60);
  const mins = m % 60;

  if (days > 0) {
    const parts = [`${days}d`];
    if (hours > 0) parts.push(`${hours}h`);
    if (mins > 0) parts.push(`${mins}m`);
    return parts.join(' ');
  }

  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Calculates the next state transition (time until opening, closing, lunch, etc.) for a market.
 */
export function getNextTransition(
  market: MarketConfig,
  localTime: DateTime,
  _status: MarketStatus,
  options: EvaluateMarketOptions = {}
): MarketTransition | undefined {
  if (!market.sessions || market.sessions.length === 0) return undefined;

  const localDateStr = localTime.toFormat('yyyy-MM-dd');
  const isTodayHoliday = !options.isSimulation && isMarketHoliday(market.id, localDateStr);

  // Weekend handling
  if (!options.isSimulation && isWeekend(localTime)) {
    for (let dayOffset = 1; dayOffset <= 10; dayOffset++) {
      const day = localTime.plus({ days: dayOffset }).startOf('day');
      if (isWeekend(day)) continue;
      if (isMarketHoliday(market.id, day.toFormat('yyyy-MM-dd'))) continue;

      const firstSession = market.sessions[0];
      const { hour, minute } = parseTime(firstSession.start);
      const dayOpen = day.set({ hour, minute, second: 0, millisecond: 0 });
      const diffMins = Math.round(dayOpen.diff(localTime, 'minutes').minutes);
      const dayName = day.toFormat('ccc', { locale: 'es' });
      return {
        type: 'open',
        inMinutes: diffMins,
        formattedCountdown: `Abre ${dayName} ${firstSession.start}`
      };
    }
  }

  // If currently active (open, lunch, pre_market) and not a holiday
  if (!isTodayHoliday) {
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
        const diffMins = Math.round(sessionEnd.diff(localTime, 'minutes').minutes);
        if (session.type === 'lunch') {
          return {
            type: 'resume',
            inMinutes: diffMins,
            formattedCountdown: `Reanuda en ${formatMinutesCountdown(diffMins)}`
          };
        }
        const nextSession = market.sessions.find((s) => s.start === session.end);
        if (nextSession?.type === 'lunch') {
          return {
            type: 'lunch',
            inMinutes: diffMins,
            formattedCountdown: `Almuerzo en ${formatMinutesCountdown(diffMins)}`
          };
        }
        return {
          type: 'close',
          inMinutes: diffMins,
          formattedCountdown: `Cierra en ${formatMinutesCountdown(diffMins)}`
        };
      }
    }
  }

  // If currently closed (or today is a holiday), find next session start across upcoming days
  for (let dayOffset = 0; dayOffset <= 10; dayOffset++) {
    const day = localTime.plus({ days: dayOffset }).startOf('day');
    if (!options.isSimulation && isWeekend(day)) continue;
    if (!options.isSimulation && isMarketHoliday(market.id, day.toFormat('yyyy-MM-dd'))) continue;

    for (const session of market.sessions) {
      const { hour: startH, minute: startM } = parseTime(session.start);
      const sessionStart = day.set({
        hour: startH,
        minute: startM,
        second: 0,
        millisecond: 0
      });

      if (sessionStart > localTime) {
        const diffMins = Math.round(sessionStart.diff(localTime, 'minutes').minutes);
        const prefix = session.type === 'pre_market' ? 'Pre en' : 'Abre en';

        let formattedCountdown: string;
        if (isTodayHoliday && dayOffset >= 1) {
          const dayName = day.toFormat('ccc', { locale: 'es' });
          formattedCountdown = `Abre ${dayName} ${session.start}`;
        } else {
          formattedCountdown = `${prefix} ${formatMinutesCountdown(diffMins)}`;
        }

        return {
          type: 'open',
          inMinutes: diffMins,
          formattedCountdown
        };
      }
    }
  }

  return undefined;
}

/**
 * Evaluates the status and local time of a market at a specific instant.
 * Recognizes weekends (Saturday/Sunday) and official exchange holidays unless isSimulation is set to true.
 */
export function evaluateMarketAt(
  market: MarketConfig,
  instant: DateTime,
  options: EvaluateMarketOptions = {}
): MarketEvaluation {
  const localTime = instant.setZone(market.timezone);

  if (!options.isSimulation && isWeekend(localTime)) {
    const nextTransition = getNextTransition(market, localTime, 'closed', options);
    return {
      marketId: market.id,
      status: 'closed',
      localTimeFormatted: localTime.toFormat('HH:mm'),
      localDateFormatted: localTime.toFormat('ccc d MMM', { locale: 'es' }),
      activeSegmentLabel: 'Fin de semana',
      nextTransition
    };
  }

  const localDateStr = localTime.toFormat('yyyy-MM-dd');
  const holiday = getMarketHoliday(market.id, localDateStr);
  if (!options.isSimulation && holiday) {
    const nextTransition = getNextTransition(market, localTime, 'closed', options);
    return {
      marketId: market.id,
      status: 'closed',
      localTimeFormatted: localTime.toFormat('HH:mm'),
      localDateFormatted: localTime.toFormat('ccc d MMM', { locale: 'es' }),
      activeSegmentLabel: `Feriado: ${holiday.name}`,
      holiday,
      nextTransition
    };
  }

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

  const nextTransition = getNextTransition(market, localTime, status, options);

  return {
    marketId: market.id,
    status,
    localTimeFormatted: localTime.toFormat('HH:mm'),
    localDateFormatted: localTime.toFormat('ccc d MMM', { locale: 'es' }),
    activeSegmentLabel,
    nextTransition
  };
}

/**
 * Converts a DateTime in Santiago to wall-clock minutes (0-1440) on the reference day.
 * Uses the clock face (hour * 60 + minute) rather than elapsed physical duration,
 * preventing timeline distortion on DST transition days (23h or 25h).
 */
export function dateTimeToWallClockMinutes(
  dt: DateTime,
  referenceDate: DateTime = DateTime.now().setZone(CHILE_TZ)
): number {
  const refDayStart = referenceDate.setZone(CHILE_TZ).startOf('day');
  const refDayEnd = refDayStart.plus({ days: 1 });

  if (dt <= refDayStart) return 0;
  if (dt >= refDayEnd) return 1440;
  return dt.hour * 60 + dt.minute;
}

/**
 * Converts a minute offset (0-1440) on the reference day to a DateTime in Santiago.
 * Maps directly to wall-clock time (hour and minute on the reference date)
 * ensuring minute 720 always corresponds to 12:00, even during DST changeover days.
 */
export function minuteOffsetToDateTime(
  minuteOffset: number,
  referenceDate: DateTime = DateTime.now().setZone(CHILE_TZ)
): DateTime {
  const clamped = Math.max(0, Math.min(1440, minuteOffset));
  const refDayStart = referenceDate.setZone(CHILE_TZ).startOf('day');

  if (clamped >= 1440) {
    return refDayStart.plus({ days: 1 });
  }

  const hour = Math.floor(clamped / 60);
  const minute = Math.floor(clamped % 60);

  return refDayStart.set({
    hour,
    minute,
    second: 0,
    millisecond: 0
  });
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
