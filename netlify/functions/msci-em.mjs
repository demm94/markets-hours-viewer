export const MSCI_EM_SYMBOL = '^891800-USD-NETR';
export const MSCI_EM_NAME = 'MSCI EM Net USD';

const UPSTREAM_HOSTS = [
  'https://query1.finance.yahoo.com',
  'https://query2.finance.yahoo.com'
];
const UPSTREAM_PATH = '/v8/finance/chart/%5E891800-USD-NETR?interval=5m&range=1d';
const REQUEST_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; MarketsPWA/1.0)',
  Accept: 'application/json'
};
const REQUEST_TIMEOUT_MS = 6000;
const STALE_THRESHOLD_SECONDS = 20 * 60;

function firstFinite(...values) {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
  }
  return null;
}

export function downsampleSeries(points, maxPoints = 96) {
  if (!Array.isArray(points) || maxPoints <= 0) {
    return [];
  }
  if (points.length <= maxPoints) {
    return points.slice();
  }
  if (maxPoints === 1) {
    return [points[points.length - 1]];
  }

  const lastIndex = points.length - 1;
  const seen = new Set();
  const sampled = [];

  for (let i = 0; i < maxPoints; i += 1) {
    const idx = Math.round((i * lastIndex) / (maxPoints - 1));
    if (!seen.has(idx)) {
      seen.add(idx);
      sampled.push(points[idx]);
    }
  }

  return sampled;
}

export function parseYahooChartResponse(payload, nowUnixSec = Math.floor(Date.now() / 1000)) {
  if (!payload || typeof payload !== 'object' || payload.chart?.error) {
    const reason = payload?.chart?.error?.description || 'upstream returned error';
    throw new Error(`Invalid Yahoo Finance chart payload: ${reason}`);
  }

  const result = payload.chart?.result?.[0];
  const meta = result?.meta;
  if (!result || !meta || typeof meta !== 'object') {
    throw new Error('Invalid Yahoo Finance chart payload: missing result metadata');
  }

  const timestamps = Array.isArray(result.timestamp) ? result.timestamp : [];
  const closes = Array.isArray(result.indicators?.quote?.[0]?.close)
    ? result.indicators.quote[0].close
    : [];

  const rawSeries = [];
  const pairCount = Math.min(timestamps.length, closes.length);
  for (let i = 0; i < pairCount; i += 1) {
    const t = timestamps[i];
    const v = closes[i];
    if (typeof t === 'number' && Number.isFinite(t) && typeof v === 'number' && Number.isFinite(v)) {
      rawSeries.push({ t, v });
    }
  }

  const series = downsampleSeries(rawSeries, 96);
  const lastPoint = series.length > 0 ? series[series.length - 1] : null;

  const price = firstFinite(meta.regularMarketPrice, meta.fulldayPrice, lastPoint?.v);
  if (price === null) {
    throw new Error('Invalid Yahoo Finance chart payload: missing price');
  }

  // Yahoo returns currency: null for proprietary MSCI index tickers
  const currency =
    typeof meta.currency === 'string' && meta.currency.trim().length > 0
      ? meta.currency.trim()
      : 'USD';

  const previousClose = firstFinite(meta.previousClose, meta.chartPreviousClose);

  const rawChange = firstFinite(meta.fulldayChange);
  const change =
    rawChange !== null
      ? rawChange
      : previousClose !== null
        ? Number((price - previousClose).toFixed(4))
        : null;

  const rawChangePercent = firstFinite(meta.regularMarketChangePercent, meta.fulldayChangePercent);
  const changePercent =
    rawChangePercent !== null
      ? rawChangePercent
      : previousClose !== null && previousClose > 0
        ? Number((((price - previousClose) / previousClose) * 100).toFixed(4))
        : null;

  let seriesMax = null;
  let seriesMin = null;
  for (const point of series) {
    if (seriesMax === null || point.v > seriesMax) seriesMax = point.v;
    if (seriesMin === null || point.v < seriesMin) seriesMin = point.v;
  }

  const dayHigh = firstFinite(meta.regularMarketDayHigh, seriesMax);
  const dayLow = firstFinite(meta.regularMarketDayLow, seriesMin);
  const marketTime = firstFinite(meta.regularMarketTime, lastPoint?.t);

  const regular = meta.currentTradingPeriod?.regular;
  const inTradingWindow =
    regular != null &&
    typeof regular.start === 'number' &&
    Number.isFinite(regular.start) &&
    typeof regular.end === 'number' &&
    Number.isFinite(regular.end) &&
    nowUnixSec >= regular.start &&
    nowUnixSec <= regular.end;

  const ageSeconds = marketTime !== null ? nowUnixSec - marketTime : Infinity;
  const marketState =
    inTradingWindow && ageSeconds <= STALE_THRESHOLD_SECONDS
      ? 'live'
      : inTradingWindow
        ? 'stale'
        : 'closed';

  return {
    symbol: MSCI_EM_SYMBOL,
    name: MSCI_EM_NAME,
    currency,
    price,
    previousClose,
    change,
    changePercent,
    dayHigh,
    dayLow,
    marketTime,
    marketState,
    fetchedAt: new Date(nowUnixSec * 1000).toISOString(),
    series,
    source: 'yahoo'
  };
}

export async function fetchMsciEmQuote(fetchImpl = fetch, nowUnixSec) {
  let lastError;

  for (const host of UPSTREAM_HOSTS) {
    try {
      const response = await fetchImpl(`${host}${UPSTREAM_PATH}`, {
        headers: REQUEST_HEADERS,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
      });
      if (!response.ok) {
        throw new Error(`Upstream HTTP ${response.status} from ${host}`);
      }
      const payload = await response.json();
      return parseYahooChartResponse(payload, nowUnixSec);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Failed to fetch MSCI EM Net USD quote');
}

export async function handleMsciEmRequest(req, fetchImpl = fetch, nowUnixSec) {
  const method = (req?.method || 'GET').toUpperCase();

  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        Allow: 'GET, HEAD, OPTIONS',
        'Cache-Control': 'no-store'
      }
    });
  }

  if (method !== 'GET' && method !== 'HEAD') {
    return new Response(JSON.stringify({ error: 'METHOD_NOT_ALLOWED' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Allow: 'GET, HEAD, OPTIONS',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  }

  try {
    const quote = await fetchMsciEmQuote(fetchImpl, nowUnixSec);
    const headers = {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=15, s-maxage=30, stale-while-revalidate=60',
      'X-Content-Type-Options': 'nosniff'
    };

    return new Response(method === 'HEAD' ? null : JSON.stringify(quote), {
      status: 200,
      headers
    });
  } catch {
    return new Response(
      JSON.stringify({
        error: 'UPSTREAM_UNAVAILABLE',
        message: 'Unable to fetch MSCI EM Net USD quote'
      }),
      {
        status: 502,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store',
          'X-Content-Type-Options': 'nosniff'
        }
      }
    );
  }
}

export default async function handler(req) {
  return handleMsciEmRequest(req);
}

export const config = {
  path: '/api/msci-em'
};
