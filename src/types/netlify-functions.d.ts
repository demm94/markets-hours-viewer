declare module '*/netlify/functions/msci-em.mjs' {
  export interface MsciEmFunctionPoint {
    t: number;
    v: number;
  }

  export type MsciEmFunctionMarketState = 'live' | 'closed' | 'stale';

  export interface MsciEmFunctionQuote {
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
    marketState: MsciEmFunctionMarketState;
    sessionStart: number | null;
    sessionEnd: number | null;
    fetchedAt: string;
    series: MsciEmFunctionPoint[];
    source: 'yahoo';
  }

  export const MSCI_EM_SYMBOL: string;
  export const MSCI_EM_NAME: string;

  export function downsampleSeries(
    points: MsciEmFunctionPoint[],
    maxPoints?: number
  ): MsciEmFunctionPoint[];

  export function parseYahooChartResponse(
    payload: unknown,
    nowUnixSec?: number
  ): MsciEmFunctionQuote;

  export function fetchMsciEmQuote(
    fetchImpl?: typeof fetch,
    nowUnixSec?: number
  ): Promise<MsciEmFunctionQuote>;

  export function handleMsciEmRequest(
    req: Request,
    fetchImpl?: typeof fetch,
    nowUnixSec?: number
  ): Promise<Response>;

  export const config: { path: string };
  export default function handler(req: Request): Promise<Response>;
}
