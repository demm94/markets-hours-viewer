import { DateTime } from 'luxon';
import { MarketEvent, FormattedMarketEvent, EventImportance } from './types';
import { MARKETS, CHILE_CONFIG } from './markets';

export const MARKET_TIMEZONE_MAP: Record<string, string> = {
  [CHILE_CONFIG.id]: CHILE_CONFIG.timezone,
  ...Object.fromEntries(MARKETS.map((m) => [m.id, m.timezone]))
};

export const MARKET_EVENTS: MarketEvent[] = [
  // Estados Unidos (NYSE / NASDAQ)
  {
    id: 'us-fomc-sep-2026',
    marketId: 'nyse',
    title: 'Decisión de Tasas FOMC (Fed)',
    description: 'Declaración del Comité Federal de Mercado Abierto y conferencia de prensa.',
    category: 'central_bank',
    importance: 'high',
    timestampUtc: '2026-09-16T18:00:00Z',
    forecast: '5.25%',
    previous: '5.50%'
  },
  {
    id: 'us-cpi-oct-2026',
    marketId: 'nyse',
    title: 'IPC de EE.UU. (Inflación)',
    description: 'Índice de Precios al Consumidor interanual y subyacente.',
    category: 'inflation',
    importance: 'high',
    timestampUtc: '2026-09-18T12:30:00Z',
    forecast: '2.9%',
    previous: '3.1%'
  },
  {
    id: 'us-pmi-sep-2026',
    marketId: 'nyse',
    title: 'PMI Manufacturero S&P Global',
    description: 'Indicador adelantado de actividad manufacturera e industrial.',
    category: 'employment',
    importance: 'medium',
    timestampUtc: '2026-09-22T13:45:00Z',
    forecast: '49.8',
    previous: '49.6'
  },
  {
    id: 'us-gdp-q2-2026',
    marketId: 'nyse',
    title: 'PIB Trimestral Final EE.UU.',
    description: 'Tasa de crecimiento anualizada del Producto Interno Bruto.',
    category: 'gdp',
    importance: 'high',
    timestampUtc: '2026-09-24T12:30:00Z',
    forecast: '2.8%',
    previous: '1.4%'
  },

  // China (SSE / SZSE)
  {
    id: 'cn-pboc-lpr-sep-2026',
    marketId: 'sse',
    title: 'Decisión Tasa LPR Banco Popular de China',
    description: 'Fijación mensual de la Loan Prime Rate a 1 y 5 años del PBoC.',
    category: 'central_bank',
    importance: 'high',
    timestampUtc: '2026-09-20T01:15:00Z',
    forecast: '3.35%',
    previous: '3.35%'
  },
  {
    id: 'cn-industrial-sep-2026',
    marketId: 'sse',
    title: 'Producción Industrial y Ventas Minoristas',
    description: 'Datos mensuales de actividad económica y consumo doméstico.',
    category: 'gdp',
    importance: 'medium',
    timestampUtc: '2026-09-23T02:00:00Z',
    forecast: '5.2%',
    previous: '5.1%'
  },

  // Taiwán (TWSE)
  {
    id: 'tw-cbc-rate-sep-2026',
    marketId: 'twse',
    title: 'Decisión de Política Monetaria CBC Taiwán',
    description: 'Reunión trimestral del Banco Central de la República de China (Taiwán).',
    category: 'central_bank',
    importance: 'high',
    timestampUtc: '2026-09-17T09:00:00Z',
    forecast: '2.00%',
    previous: '2.00%'
  },
  {
    id: 'tw-export-orders-sep-2026',
    marketId: 'twse',
    title: 'Órdenes de Exportación Tecnológica',
    description: 'Indicador clave de demanda en semiconductores (TSMC) y electrónica.',
    category: 'employment',
    importance: 'medium',
    timestampUtc: '2026-09-21T08:00:00Z',
    forecast: '+11.5%',
    previous: '+12.0%'
  },

  // Corea del Sur (KRX)
  {
    id: 'kr-bok-rate-oct-2026',
    marketId: 'krx',
    title: 'Decisión de Tasa Base Banco de Corea (BoK)',
    description: 'Reunión de política monetaria del comité del Banco de Corea.',
    category: 'central_bank',
    importance: 'high',
    timestampUtc: '2026-09-25T01:00:00Z',
    forecast: '3.25%',
    previous: '3.50%'
  },
  {
    id: 'kr-trade-balance-sep-2026',
    marketId: 'krx',
    title: 'Balanza Comercial y Exportación de Chips',
    description: 'Dato preliminar de exportaciones de memoria y vehículos.',
    category: 'gdp',
    importance: 'medium',
    timestampUtc: '2026-10-01T00:00:00Z',
    forecast: '+$4.2B',
    previous: '+$3.8B'
  },

  // India (NSE / BSE)
  {
    id: 'in-cpi-sep-2026',
    marketId: 'nse',
    title: 'Inflación IPC India',
    description: 'Índice de Precios al Consumidor urbano y rural.',
    category: 'inflation',
    importance: 'high',
    timestampUtc: '2026-09-17T12:00:00Z',
    forecast: '3.65%',
    previous: '3.54%'
  },
  {
    id: 'in-rbi-mpc-oct-2026',
    marketId: 'nse',
    title: 'Decisión de Tasa Repo RBI (Banco de la Reserva)',
    description: 'Resolución de política monetaria del comité del Reserve Bank of India.',
    category: 'central_bank',
    importance: 'high',
    timestampUtc: '2026-10-07T04:30:00Z',
    forecast: '6.50%',
    previous: '6.50%'
  },

  // Chile (Referencia local)
  {
    id: 'cl-tpm-oct-2026',
    marketId: 'chile',
    title: 'Reunión de Política Monetaria (RPM) Banco Central de Chile',
    description: 'Comunicado de decisión de la Tasa de Política Monetaria (TPM).',
    category: 'central_bank',
    importance: 'high',
    timestampUtc: '2026-10-15T21:00:00Z',
    forecast: '5.25%',
    previous: '5.50%'
  }
];

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
