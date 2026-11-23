import { DateTime } from 'luxon';
import { CHILE_TZ } from './timezone';

export interface MsciEmPoint {
  t: number;
  v: number;
}

export type MsciEmMarketState = 'live' | 'closed' | 'stale';
export type MsciEmDirection = 'up' | 'down' | 'flat';

export interface MsciEmQuote {
  symbol: string;
  name: string;
  currency: string;
  price: number;
  previousClose: number | null;
  change: number | null;
  changePercent: number | null;
  dayHigh: number | null;
  dayLow: number | null;
  marketTime: number | null;
  marketState: MsciEmMarketState;
  sessionStart: number | null;
  sessionEnd: number | null;
  fetchedAt: string;
  series: MsciEmPoint[];
  source: 'yahoo';
}

export interface SparklineSessionWindow {
  start: number | null;
  end: number | null;
}

export interface SparklineGeometry {
  linePath: string;
  areaPath: string;
  lastPoint: { x: number; y: number };
  previousCloseY: number | null;
  minVal: number;
  maxVal: number;
}

export const MSCI_EM_ENDPOINT = '/api/msci-em';
export const MSCI_EM_YAHOO_URL = 'https://finance.yahoo.com/quote/%5E891800-USD-NETR/';
export const MSCI_EM_CACHE_KEY = 'markets-pwa:msci-em-quote-v1';

const INDEX_PRICE_FORMATTER = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isNullableFiniteNumber(value: unknown): value is number | null {
  return value === null || isFiniteNumber(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidMarketState(value: unknown): value is MsciEmMarketState {
  return value === 'live' || value === 'closed' || value === 'stale';
}

/**
 * Validates and normalizes an untrusted JSON payload or cached entry into a MsciEmQuote.
 */
export function parseMsciEmQuote(raw: unknown): MsciEmQuote | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return null;
  }

  const record = raw as Record<string, unknown>;

  if (
    !isNonEmptyString(record.symbol) ||
    !isNonEmptyString(record.name) ||
    !isNonEmptyString(record.currency) ||
    !isFiniteNumber(record.price) ||
    !isNullableFiniteNumber(record.previousClose) ||
    !isNullableFiniteNumber(record.change) ||
    !isNullableFiniteNumber(record.changePercent) ||
    !isNullableFiniteNumber(record.dayHigh) ||
    !isNullableFiniteNumber(record.dayLow) ||
    !isNullableFiniteNumber(record.marketTime) ||
    !isValidMarketState(record.marketState) ||
    (record.sessionStart !== undefined && !isNullableFiniteNumber(record.sessionStart)) ||
    (record.sessionEnd !== undefined && !isNullableFiniteNumber(record.sessionEnd)) ||
    !isNonEmptyString(record.fetchedAt) ||
    record.source !== 'yahoo' ||
    !Array.isArray(record.series)
  ) {
    return null;
  }

  const series: MsciEmPoint[] = [];
  for (const item of record.series) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      return null;
    }
    const point = item as Record<string, unknown>;
    if (!isFiniteNumber(point.t) || !isFiniteNumber(point.v)) {
      return null;
    }
    series.push({ t: point.t, v: point.v });
  }

  return {
    symbol: record.symbol,
    name: record.name,
    currency: record.currency,
    price: record.price,
    previousClose: record.previousClose,
    change: record.change,
    changePercent: record.changePercent,
    dayHigh: record.dayHigh,
    dayLow: record.dayLow,
    marketTime: record.marketTime,
    marketState: record.marketState,
    sessionStart: isFiniteNumber(record.sessionStart) ? record.sessionStart : null,
    sessionEnd: isFiniteNumber(record.sessionEnd) ? record.sessionEnd : null,
    fetchedAt: record.fetchedAt,
    series,
    source: 'yahoo'
  };
}

export function getMsciEmDirection(
  change: number | null,
  changePercent: number | null
): MsciEmDirection {
  const basis =
    change !== null && Number.isFinite(change) ? change : changePercent;
  if (basis === null || !Number.isFinite(basis)) {
    return 'flat';
  }
  if (basis > 0.0001) return 'up';
  if (basis < -0.0001) return 'down';
  return 'flat';
}

export function formatIndexPrice(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return INDEX_PRICE_FORMATTER.format(value);
}

export function formatSignedPoints(value: number | null): string | null {
  if (value === null || !Number.isFinite(value)) return null;
  if (Math.abs(value) < 0.005) return '0.00';
  const sign = value > 0 ? '+' : '-';
  return `${sign}${INDEX_PRICE_FORMATTER.format(Math.abs(value))}`;
}

export function formatSignedPercent(value: number | null): string | null {
  if (value === null || !Number.isFinite(value)) return null;
  if (Math.abs(value) < 0.005) return '0.00%';
  const sign = value > 0 ? '+' : '-';
  return `${sign}${INDEX_PRICE_FORMATTER.format(Math.abs(value))}%`;
}

export function formatMarketTimeChile(marketTimeUnix: number | null): string | null {
  if (marketTimeUnix === null || !Number.isFinite(marketTimeUnix)) return null;
  const dt = DateTime.fromSeconds(marketTimeUnix, { zone: CHILE_TZ });
  return dt.isValid ? dt.toFormat('HH:mm') : null;
}

/**
 * Computes SVG line/area paths and optional previous-close reference line Y coordinate.
 */
export function buildSparklineGeometry(
  series: MsciEmPoint[],
  previousClose: number | null,
  width = 120,
  height = 32,
  padY = 4,
  sessionWindow?: SparklineSessionWindow | null
): SparklineGeometry | null {
  if (series.length < 2) {
    return null;
  }

  let minVal = series[0].v;
  let maxVal = series[0].v;
  let minT = series[0].t;
  let maxT = series[0].t;
  for (let i = 1; i < series.length; i += 1) {
    const val = series[i].v;
    const t = series[i].t;
    if (val < minVal) minVal = val;
    if (val > maxVal) maxVal = val;
    if (t < minT) minT = t;
    if (t > maxT) maxT = t;
  }

  const lastIndex = series.length - 1;
  const span = maxVal - minVal;
  const usableHeight = Math.max(1, height - padY * 2);

  const sessionStart = sessionWindow?.start;
  const sessionEnd = sessionWindow?.end;
  const activeSessionWindow =
    isFiniteNumber(sessionStart) &&
    isFiniteNumber(sessionEnd) &&
    sessionEnd > sessionStart &&
    maxT >= sessionStart &&
    minT <= sessionEnd
      ? { start: sessionStart, span: sessionEnd - sessionStart }
      : null;
  const timeSpan = maxT - minT;

  const mapX = (t: number, index: number): number => {
    if (activeSessionWindow) {
      const ratio = Math.min(1, Math.max(0, (t - activeSessionWindow.start) / activeSessionWindow.span));
      return Number((ratio * width).toFixed(2));
    }
    if (timeSpan > 0) {
      const ratio = (t - minT) / timeSpan;
      return Number((ratio * width).toFixed(2));
    }
    return Number(((index / lastIndex) * width).toFixed(2));
  };

  const mapY = (val: number): number => {
    if (span <= 0) {
      return Number((height / 2).toFixed(2));
    }
    return Number((padY + ((maxVal - val) / span) * usableHeight).toFixed(2));
  };

  const coords: Array<{ x: number; y: number }> = series.map((point, index) => ({
    x: mapX(point.t, index),
    y: mapY(point.v)
  }));

  const linePath = coords
    .map((pt, index) => `${index === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`)
    .join(' ');
  const firstPoint = coords[0];
  const lastPoint = coords[coords.length - 1];
  const areaPath = `${linePath} L ${lastPoint.x} ${height} L ${firstPoint.x} ${height} Z`;

  const previousCloseY =
    span > 0 &&
    previousClose !== null &&
    Number.isFinite(previousClose) &&
    previousClose >= minVal &&
    previousClose <= maxVal
      ? mapY(previousClose)
      : null;

  return {
    linePath,
    areaPath,
    lastPoint,
    previousCloseY,
    minVal,
    maxVal
  };
}
