import { DateTime } from 'luxon';
import { MarketConfig, TimelineSegment, TradingWindow, LiquidityLevel } from './types';
import { projectMarketToTimeline, formatMinutes, CHILE_TZ } from './timezone';
import { getMarketHoliday } from './holidays';
import { getEventsForChileDay } from './events';

interface WindowTemplate {
  id: string;
  name: string;
  subtitle: string;
  icon: string;
  startMinute: number;
  endMinute: number;
  description: string;
  targetMarketIds: string[];
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/**
 * Computes consolidated trading windows and market concurrency for a given day in Chile time.
 */
export function getTradingWindows(
  referenceDate: DateTime,
  markets: MarketConfig[],
  currentMinuteInChile?: number
): TradingWindow[] {
  const chileDate = referenceDate.setZone(CHILE_TZ);
  const isoDate = chileDate.toISODate()!;
  const dailyEventsMap = getEventsForChileDay(chileDate);
  const allDailyEvents = Object.values(dailyEventsMap).flat();

  // Dynamic discovery of key boundary minutes from actual market projections
  const marketSegmentsMap: Record<string, TimelineSegment[]> = {};
  const holidaysMap: Record<string, string> = {};

  for (const m of markets) {
    marketSegmentsMap[m.id] = projectMarketToTimeline(m, chileDate);
    const hol = getMarketHoliday(m.id, isoDate);
    if (hol) {
      holidaysMap[m.id] = hol.name;
    }
  }

  const nyseSegments = marketSegmentsMap['nyse'] ?? [];
  const nyseStart = nyseSegments[0]?.startMinute ?? 630;  // 10:30 default
  const nyseEnd = nyseSegments[0]?.endMinute ?? 1020;     // 17:00 default

  const nseSegments = marketSegmentsMap['nse'] ?? [];
  const nseEnd = nseSegments[0]?.endMinute ?? 420;        // 07:00 default

  const twseSegments = marketSegmentsMap['twse'] ?? [];
  const asiaReopenStart = twseSegments.find((s) => s.startMinute >= 1200)?.startMinute ?? 1320; // 22:00 default

  // Macro window templates aligned to real-time market boundaries
  const templates: WindowTemplate[] = [
    {
      id: 'asia_night',
      name: 'Convergencia Asiática (Madrugada)',
      subtitle: 'Solapamiento de Taiwán, China, Corea del Sur e India',
      icon: '🌏',
      startMinute: 0,
      endMinute: 240, // 00:00 to 04:00
      description: 'Pico de liquidez y volatilidad en semiconductores, manufactura tecnológica y materias primas asiáticas.',
      targetMarketIds: ['twse', 'krx', 'sse', 'nse']
    },
    {
      id: 'india_solo',
      name: 'Rueda Exclusiva India (NSE)',
      subtitle: 'Sesión activa del subcontinente indio',
      icon: '🇮🇳',
      startMinute: 240,
      endMinute: nseEnd, // 04:00 to 07:00
      description: 'Único gran mercado global operando en esta franja previa a la apertura europea y americana.',
      targetMarketIds: ['nse']
    },
    {
      id: 'morning_pause',
      name: 'Pausa Global Inter-Sesión',
      subtitle: 'Transición interbursátil y pre-mercado de Wall Street',
      icon: '☕',
      startMinute: nseEnd,
      endMinute: nyseStart, // 07:00 to 10:30
      description: 'Mercados asiáticos concluidos. Período de asimilación de noticias macro antes de la campana en Nueva York.',
      targetMarketIds: []
    },
    {
      id: 'us_session',
      name: 'Sesión Americana (Wall Street)',
      subtitle: 'NYSE & NASDAQ en sincronía con horario hábil de Chile',
      icon: '🗽',
      startMinute: nyseStart,
      endMinute: nyseEnd, // 10:30 to 17:00
      description: 'Máximo volumen institucional global. Total convergencia operativa con el horario laboral y financiero de Chile.',
      targetMarketIds: ['nyse']
    },
    {
      id: 'evening_pause',
      name: 'Cierre Global y After-Hours',
      subtitle: 'Post-mercado americano y balance diario',
      icon: '🌙',
      startMinute: nyseEnd,
      endMinute: asiaReopenStart, // 17:00 to 22:00
      description: 'Jornada occidental cerrada. Ventana de reportes trimestrales de ganancias y calma en libro de órdenes.',
      targetMarketIds: []
    },
    {
      id: 'asia_reopen',
      name: 'Apertura de Mercados Asiáticos',
      subtitle: 'Inicio de la nueva jornada bursátil en Asia',
      icon: '⚡',
      startMinute: asiaReopenStart,
      endMinute: 1440, // 22:00 to 24:00
      description: 'Apertura de Taiwán, Corea del Sur y Shanghái. Primeras reacciones de precios a los cierres estadounidenses.',
      targetMarketIds: ['twse', 'krx', 'sse']
    }
  ];

  return templates.map((tmpl) => {
    const duration = tmpl.endMinute - tmpl.startMinute;

    // Determine active markets in this window
    const activeMarkets = markets.filter((m) => {
      // Must match window scope and have session segments overlapping
      if (!tmpl.targetMarketIds.includes(m.id)) return false;
      const segments = marketSegmentsMap[m.id] ?? [];
      const hasOverlap = segments.some(
        (seg) => seg.startMinute < tmpl.endMinute && seg.endMinute > tmpl.startMinute
      );
      // Exclude if market is on holiday
      return hasOverlap && !holidaysMap[m.id];
    });

    const concurrencyCount = activeMarkets.length;

    let liquidityLevel: LiquidityLevel = 'quiet';
    if (concurrencyCount >= 2 || tmpl.id === 'us_session') {
      liquidityLevel = 'high';
    } else if (concurrencyCount === 1) {
      liquidityLevel = 'moderate';
    }

    const windowEvents = allDailyEvents.filter(
      (e) => e.minuteInChile >= tmpl.startMinute && e.minuteInChile < tmpl.endMinute
    );

    const holidayNames: string[] = [];
    for (const mId of tmpl.targetMarketIds) {
      if (holidaysMap[mId]) {
        const m = markets.find((x) => x.id === mId);
        holidayNames.push(`${m?.name ?? mId}: ${holidaysMap[mId]}`);
      }
    }

    const isCurrent =
      currentMinuteInChile !== undefined &&
      currentMinuteInChile >= tmpl.startMinute &&
      currentMinuteInChile < tmpl.endMinute;

    const progressPercent = isCurrent
      ? Math.round(
          Math.min(100, Math.max(0, ((currentMinuteInChile - tmpl.startMinute) / duration) * 100))
        )
      : undefined;

    const minutesRemaining = isCurrent
      ? Math.max(0, tmpl.endMinute - currentMinuteInChile)
      : undefined;

    return {
      id: tmpl.id,
      name: tmpl.name,
      subtitle: tmpl.subtitle,
      icon: tmpl.icon,
      startMinute: tmpl.startMinute,
      endMinute: tmpl.endMinute,
      startTimeFormatted: formatMinutes(tmpl.startMinute),
      endTimeFormatted: tmpl.endMinute === 1440 ? '24:00' : formatMinutes(tmpl.endMinute),
      durationFormatted: formatDuration(duration),
      marketIds: activeMarkets.map((m) => m.id),
      activeMarkets,
      concurrencyCount,
      liquidityLevel,
      description: tmpl.description,
      isCurrent,
      progressPercent,
      minutesRemaining,
      events: windowEvents,
      holidayNames: holidayNames.length > 0 ? holidayNames : undefined
    };
  });
}
