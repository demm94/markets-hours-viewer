import { describe, it, expect, vi } from 'vitest';
import {
  MSCI_EM_NAME,
  MSCI_EM_SYMBOL,
  downsampleSeries,
  handleMsciEmRequest,
  parseYahooChartResponse
} from '../../netlify/functions/msci-em.mjs';
import {
  buildSparklineGeometry,
  formatIndexPrice,
  formatMarketTimeChile,
  formatSignedPercent,
  formatSignedPoints,
  getMsciEmDirection,
  parseMsciEmQuote
} from './msci-em';

function createYahooPayload(overrides: {
  meta?: Record<string, unknown>;
  timestamp?: number[];
  closes?: Array<number | null>;
} = {}) {
  return {
    chart: {
      error: null,
      result: [
        {
          meta: {
            currency: null,
            symbol: MSCI_EM_SYMBOL,
            regularMarketPrice: 786.02,
            regularMarketTime: 1795151865,
            regularMarketChangePercent: -3.437,
            fulldayChange: -27.98,
            fulldayChangePercent: -3.437,
            regularMarketDayHigh: 808.95,
            regularMarketDayLow: 785.65,
            previousClose: 814,
            chartPreviousClose: 814,
            currentTradingPeriod: {
              regular: {
                start: 1795150800,
                end: 1795237140
              }
            },
            ...overrides.meta
          },
          timestamp: overrides.timestamp ?? [1795150800, 1795151100, 1795151400],
          indicators: {
            quote: [
              {
                close: overrides.closes ?? [808.5, 795.1, 786.02]
              }
            ]
          }
        }
      ]
    }
  };
}

describe('MSCI EM Net USD Netlify function helpers', () => {
  it('parses a live Yahoo chart payload and defaults null currency to USD', () => {
    const nowUnix = 1795152000; // 135s after regularMarketTime, inside regular period
    const parsed = parseYahooChartResponse(createYahooPayload(), nowUnix);

    expect(parsed.symbol).toBe(MSCI_EM_SYMBOL);
    expect(parsed.name).toBe(MSCI_EM_NAME);
    expect(parsed.currency).toBe('USD');
    expect(parsed.price).toBe(786.02);
    expect(parsed.previousClose).toBe(814);
    expect(parsed.change).toBe(-27.98);
    expect(parsed.changePercent).toBe(-3.437);
    expect(parsed.dayHigh).toBe(808.95);
    expect(parsed.dayLow).toBe(785.65);
    expect(parsed.marketTime).toBe(1795151865);
    expect(parsed.marketState).toBe('live');
    expect(parsed.source).toBe('yahoo');
    expect(parsed.series).toHaveLength(3);
    expect(parsed.fetchedAt).toBe(new Date(nowUnix * 1000).toISOString());
  });

  it('computes fallback change, percent, and day high/low from series when meta fields are omitted', () => {
    const payload = createYahooPayload({
      meta: {
        currency: ' USD ',
        fulldayChange: undefined,
        regularMarketChangePercent: undefined,
        fulldayChangePercent: undefined,
        regularMarketDayHigh: undefined,
        regularMarketDayLow: undefined,
        regularMarketPrice: 820,
        previousClose: 800
      },
      timestamp: [1795150800, 1795151100, 1795151400, 1795151700],
      closes: [798.5, null, 825.25, 820]
    });

    const parsed = parseYahooChartResponse(payload, 1795151800);
    expect(parsed.currency).toBe('USD');
    expect(parsed.change).toBe(20);
    expect(parsed.changePercent).toBe(2.5);
    expect(parsed.dayLow).toBe(798.5);
    expect(parsed.dayHigh).toBe(825.25);
    expect(parsed.series).toEqual([
      { t: 1795150800, v: 798.5 },
      { t: 1795151400, v: 825.25 },
      { t: 1795151700, v: 820 }
    ]);
  });

  it('determines live, stale, and closed marketState accurately', () => {
    const basePayload = createYahooPayload();

    expect(parseYahooChartResponse(basePayload, 1795151865 + 600).marketState).toBe('live');
    expect(parseYahooChartResponse(basePayload, 1795151865 + 25 * 60).marketState).toBe('stale');
    expect(parseYahooChartResponse(basePayload, 1795238000).marketState).toBe('closed');
  });

  it('throws on Yahoo chart error or missing price', () => {
    expect(() =>
      parseYahooChartResponse({ chart: { error: { description: 'Not Found' }, result: null } })
    ).toThrow(/Not Found/);

    const missingPrice = createYahooPayload({
      meta: { regularMarketPrice: null, fulldayPrice: null },
      closes: [null, null, null]
    });
    expect(() => parseYahooChartResponse(missingPrice, 1795152000)).toThrow(/missing price/);
  });

  it('downsamples long series while preserving endpoints', () => {
    const points = Array.from({ length: 240 }, (_, i) => ({ t: 1000 + i * 60, v: 700 + i }));
    const sampled = downsampleSeries(points, 96);

    expect(sampled).toHaveLength(96);
    expect(sampled[0]).toEqual(points[0]);
    expect(sampled[sampled.length - 1]).toEqual(points[points.length - 1]);
  });

  it('handles GET, HEAD, OPTIONS, 405, query1->query2 fallback, and 502 upstream errors', async () => {
    const payload = createYahooPayload();
    const okFetch = vi.fn().mockImplementation(async () =>
      new Response(JSON.stringify(payload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    );

    const getRes = await handleMsciEmRequest(
      new Request('http://localhost/api/msci-em', { method: 'GET' }),
      okFetch as unknown as typeof fetch,
      1795152000
    );
    expect(getRes.status).toBe(200);
    expect(getRes.headers.get('cache-control')).toContain('s-maxage=30');
    const getBody = await getRes.json();
    expect(parseMsciEmQuote(getBody)).not.toBeNull();

    const headRes = await handleMsciEmRequest(
      new Request('http://localhost/api/msci-em', { method: 'HEAD' }),
      okFetch as unknown as typeof fetch,
      1795152000
    );
    expect(headRes.status).toBe(200);
    expect(await headRes.text()).toBe('');

    const optRes = await handleMsciEmRequest(
      new Request('http://localhost/api/msci-em', { method: 'OPTIONS' }),
      okFetch as unknown as typeof fetch
    );
    expect(optRes.status).toBe(204);

    const postRes = await handleMsciEmRequest(
      new Request('http://localhost/api/msci-em', { method: 'POST' }),
      okFetch as unknown as typeof fetch
    );
    expect(postRes.status).toBe(405);
    expect(postRes.headers.get('allow')).toBe('GET, HEAD, OPTIONS');

    const fallbackFetch = vi
      .fn()
      .mockRejectedValueOnce(new Error('query1 network failure'))
      .mockResolvedValueOnce(new Response(JSON.stringify(payload), { status: 200 }));

    const fallbackRes = await handleMsciEmRequest(
      new Request('http://localhost/api/msci-em', { method: 'GET' }),
      fallbackFetch as unknown as typeof fetch,
      1795152000
    );
    expect(fallbackRes.status).toBe(200);
    expect(fallbackFetch).toHaveBeenCalledTimes(2);
    expect(String(fallbackFetch.mock.calls[0][0])).toContain('query1.finance.yahoo.com');
    expect(String(fallbackFetch.mock.calls[1][0])).toContain('query2.finance.yahoo.com');

    const failFetch = vi.fn().mockResolvedValue(new Response('oops', { status: 503 }));
    const errRes = await handleMsciEmRequest(
      new Request('http://localhost/api/msci-em', { method: 'GET' }),
      failFetch as unknown as typeof fetch
    );
    expect(errRes.status).toBe(502);
    expect(errRes.headers.get('cache-control')).toBe('no-store');
    expect(await errRes.json()).toEqual({
      error: 'UPSTREAM_UNAVAILABLE',
      message: 'Unable to fetch MSCI EM Net USD quote'
    });
  });
});

describe('MSCI EM Net USD client domain helpers', () => {
  it('validates normalized payloads with parseMsciEmQuote', () => {
    const valid = parseYahooChartResponse(createYahooPayload(), 1795152000);
    expect(parseMsciEmQuote(valid)).toEqual(valid);

    expect(parseMsciEmQuote(null)).toBeNull();
    expect(parseMsciEmQuote([])).toBeNull();
    expect(parseMsciEmQuote({ ...valid, price: Number.NaN })).toBeNull();
    expect(parseMsciEmQuote({ ...valid, marketState: 'unknown' })).toBeNull();
    expect(parseMsciEmQuote({ ...valid, source: 'other' })).toBeNull();
    expect(parseMsciEmQuote({ ...valid, series: [{ t: 10, v: 'bad' }] })).toBeNull();
  });

  it('builds sparkline geometry, handles previousClose bounds, flat series, and short series', () => {
    expect(buildSparklineGeometry([], null)).toBeNull();
    expect(buildSparklineGeometry([{ t: 1, v: 780 }], null)).toBeNull();

    const flat = buildSparklineGeometry(
      [
        { t: 1, v: 785 },
        { t: 2, v: 785 },
        { t: 3, v: 785 }
      ],
      785,
      120,
      32,
      4
    );
    expect(flat).not.toBeNull();
    expect(flat!.linePath).toBe('M 0 16 L 60 16 L 120 16');
    expect(flat!.previousCloseY).toBeNull();

    const varied = buildSparklineGeometry(
      [
        { t: 1, v: 780 },
        { t: 2, v: 790 },
        { t: 3, v: 800 }
      ],
      790,
      120,
      32,
      4
    );
    expect(varied).not.toBeNull();
    expect(varied!.minVal).toBe(780);
    expect(varied!.maxVal).toBe(800);
    expect(varied!.linePath).toBe('M 0 28 L 60 16 L 120 4');
    expect(varied!.areaPath).toBe('M 0 28 L 60 16 L 120 4 L 120 32 L 0 32 Z');
    expect(varied!.lastPoint).toEqual({ x: 120, y: 4 });
    expect(varied!.previousCloseY).toBe(16);

    const outOfRangePrevClose = buildSparklineGeometry(
      [
        { t: 1, v: 780 },
        { t: 2, v: 800 }
      ],
      814,
      120,
      32,
      4
    );
    expect(outOfRangePrevClose!.previousCloseY).toBeNull();
  });

  it('formats index values, signed deltas, direction, and Chile timestamp', () => {
    expect(getMsciEmDirection(1.2, 0.15)).toBe('up');
    expect(getMsciEmDirection(-27.98, -3.44)).toBe('down');
    expect(getMsciEmDirection(0, 0)).toBe('flat');
    expect(getMsciEmDirection(null, -0.5)).toBe('down');

    expect(formatIndexPrice(1415.1)).toBe('1,415.10');
    expect(formatIndexPrice(786.02)).toBe('786.02');
    expect(formatSignedPoints(12.4)).toBe('+12.40');
    expect(formatSignedPoints(-27.98)).toBe('-27.98');
    expect(formatSignedPoints(0)).toBe('0.00');
    expect(formatSignedPoints(null)).toBeNull();

    expect(formatSignedPercent(1.58)).toBe('+1.58%');
    expect(formatSignedPercent(-3.437)).toBe('-3.44%');
    expect(formatSignedPercent(0)).toBe('0.00%');
    expect(formatSignedPercent(null)).toBeNull();

    expect(formatMarketTimeChile(1795151865)).toBe('02:17');
    expect(formatMarketTimeChile(null)).toBeNull();
  });
});
