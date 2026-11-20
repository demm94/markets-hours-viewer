import React, { useId, useMemo } from 'react';
import {
  Activity,
  ExternalLink,
  Minus,
  RefreshCw,
  TrendingDown,
  TrendingUp
} from 'lucide-react';
import { useMsciEmQuote } from '../hooks/useMsciEmQuote';
import {
  MSCI_EM_YAHOO_URL,
  buildSparklineGeometry,
  formatIndexPrice,
  formatMarketTimeChile,
  formatSignedPercent,
  formatSignedPoints,
  getMsciEmDirection
} from '../core/msci-em';

const DIRECTION_STYLES = {
  up: {
    badge: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    stroke: '#34d399',
    fillStart: 'rgba(16, 185, 129, 0.30)',
    fillEnd: 'rgba(16, 185, 129, 0.00)',
    dot: '#34d399'
  },
  down: {
    badge: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
    stroke: '#fb7185',
    fillStart: 'rgba(244, 63, 94, 0.30)',
    fillEnd: 'rgba(244, 63, 94, 0.00)',
    dot: '#fb7185'
  },
  flat: {
    badge: 'border-border bg-white/[0.04] text-zinc-300',
    stroke: '#94a3b8',
    fillStart: 'rgba(148, 163, 184, 0.22)',
    fillEnd: 'rgba(148, 163, 184, 0.00)',
    dot: '#94a3b8'
  }
} as const;

export const MsciEmStrip: React.FC = React.memo(() => {
  const { quote, isLoading, isRefreshing, error, isStale, refresh } = useMsciEmQuote();
  const gradientId = useId();

  const geometry = useMemo(() => {
    if (!quote) return null;
    return buildSparklineGeometry(quote.series, quote.previousClose);
  }, [quote]);

  if (isLoading && !quote) {
    return (
      <section
        aria-label="Indicador MSCI EM Net USD"
        aria-busy="true"
        className="rounded-xl border border-border bg-card backdrop-blur-md shadow-neon px-3 py-2.5 sm:px-4 sm:py-2.5 min-h-[52px] flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-4 w-32 rounded bg-white/[0.06] animate-pulse" />
          <div className="h-5 w-20 rounded bg-white/[0.08] animate-pulse" />
          <div className="h-5 w-24 rounded-md bg-white/[0.06] animate-pulse" />
        </div>
        <div className="hidden sm:block h-7 w-28 rounded bg-white/[0.05] animate-pulse" />
      </section>
    );
  }

  if (!quote) {
    return (
      <section
        aria-label="Indicador MSCI EM Net USD"
        className="rounded-xl border border-border bg-card backdrop-blur-md shadow-neon px-3 py-2 sm:px-4 sm:py-2.5 flex flex-wrap items-center justify-between gap-2"
      >
        <div className="flex items-center gap-2 min-w-0 text-xs text-zinc-300">
          <Activity className="w-3.5 h-3.5 text-zinc-400 shrink-0" aria-hidden="true" />
          <span>No se pudo cargar MSCI EM Net USD</span>
          {error && (
            <span className="hidden sm:inline text-muted-foreground font-mono">
              ({error})
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={refresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 min-h-[36px] px-2.5 py-1 rounded-lg border border-border bg-white/[0.03] hover:border-border-strong hover:bg-white/[0.06] text-xs font-medium text-zinc-200 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            <span>Reintentar</span>
          </button>
          <a
            href={MSCI_EM_YAHOO_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Abrir MSCI EM Net USD en Yahoo Finance"
            title="Ver en Yahoo Finance"
            className="inline-flex items-center justify-center min-h-[36px] min-w-[36px] rounded-lg border border-border bg-white/[0.03] hover:border-border-strong hover:bg-white/[0.06] text-zinc-300 hover:text-white transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
          </a>
        </div>
      </section>
    );
  }

  const direction = getMsciEmDirection(quote.change, quote.changePercent);
  const styles = DIRECTION_STYLES[direction];
  const DirectionIcon =
    direction === 'up' ? TrendingUp : direction === 'down' ? TrendingDown : Minus;

  const formattedPrice = formatIndexPrice(quote.price);
  const formattedPoints = formatSignedPoints(quote.change);
  const formattedPercent = formatSignedPercent(quote.changePercent);
  const updatedChileTime = formatMarketTimeChile(quote.marketTime);

  const showLivePill = quote.marketState === 'live' && !isStale;
  const showStalePill = isStale || quote.marketState === 'stale';

  const dayRangeAvailable =
    quote.dayLow !== null &&
    quote.dayHigh !== null &&
    Number.isFinite(quote.dayLow) &&
    Number.isFinite(quote.dayHigh);

  const deltaLabel =
    formattedPoints && formattedPercent
      ? `${formattedPoints} (${formattedPercent})`
      : formattedPercent ?? formattedPoints;

  return (
    <section
      aria-label="Indicador MSCI EM Net USD"
      className="rounded-xl border border-border bg-card backdrop-blur-md shadow-neon px-3 py-2.5 sm:px-4 sm:py-2.5 flex flex-col md:flex-row md:items-center md:justify-between gap-2.5 md:gap-4"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-semibold tracking-wide text-zinc-100 whitespace-nowrap">
            {quote.name}
          </span>
          <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded border border-border bg-white/[0.03] font-mono text-[11px] text-muted-foreground whitespace-nowrap">
            {quote.symbol}
          </span>
          {showLivePill ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 text-[11px] font-medium text-emerald-300 whitespace-nowrap">
              <span
                className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0"
                aria-hidden="true"
              />
              <span>En vivo</span>
            </span>
          ) : showStalePill ? (
            <span
              title={
                error
                  ? `Mostrando último dato en caché (${error})`
                  : 'Cotización con demora respecto al último tick'
              }
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-amber-500/30 bg-amber-500/10 text-[11px] font-medium text-amber-300 whitespace-nowrap"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" aria-hidden="true" />
              <span>Último dato</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-border bg-white/[0.04] text-[11px] font-medium text-zinc-300 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 shrink-0" aria-hidden="true" />
              <span>Cierre</span>
            </span>
          )}
        </div>

        <div className="flex items-baseline gap-1.5">
          <span className="font-mono text-base sm:text-lg font-bold tracking-tight text-zinc-50 tabular-nums">
            {formattedPrice}
          </span>
          <span className="font-mono text-[11px] font-medium text-muted-foreground">
            {quote.currency}
          </span>
        </div>

        {deltaLabel && (
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border font-mono text-xs font-semibold tabular-nums whitespace-nowrap ${styles.badge}`}
          >
            <DirectionIcon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>{deltaLabel}</span>
          </span>
        )}
      </div>

      <div className="flex items-center justify-between md:justify-end gap-3 min-w-0">
        <div className="flex items-center gap-3 min-w-0">
          <svg
            viewBox="0 0 120 32"
            role="img"
            aria-label="Tendencia intradía 1D de MSCI EM Net USD"
            className="w-28 sm:w-36 h-8 shrink-0 overflow-visible"
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={styles.fillStart} />
                <stop offset="100%" stopColor={styles.fillEnd} />
              </linearGradient>
            </defs>
            {geometry ? (
              <>
                {geometry.previousCloseY !== null && (
                  <line
                    x1="0"
                    y1={geometry.previousCloseY}
                    x2="120"
                    y2={geometry.previousCloseY}
                    stroke="rgba(148, 163, 184, 0.35)"
                    strokeWidth="1"
                    strokeDasharray="2 3"
                  />
                )}
                <path d={geometry.areaPath} fill={`url(#${gradientId})`} />
                <path
                  d={geometry.linePath}
                  fill="none"
                  stroke={styles.stroke}
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle
                  cx={geometry.lastPoint.x}
                  cy={geometry.lastPoint.y}
                  r="2.25"
                  fill={styles.dot}
                />
              </>
            ) : (
              <line
                x1="0"
                y1="16"
                x2="120"
                y2="16"
                stroke="rgba(148, 163, 184, 0.25)"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
            )}
          </svg>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] sm:text-xs font-mono tabular-nums text-zinc-400 min-w-0">
            {dayRangeAvailable && (
              <span className="whitespace-nowrap">
                <span className="text-muted-foreground">Rango: </span>
                <span className="text-zinc-200">
                  {formatIndexPrice(quote.dayLow!)} – {formatIndexPrice(quote.dayHigh!)}
                </span>
              </span>
            )}
            {quote.previousClose !== null && Number.isFinite(quote.previousClose) && (
              <span className="hidden xl:inline whitespace-nowrap">
                <span className="text-muted-foreground">Cierre ant.: </span>
                <span className="text-zinc-300">{formatIndexPrice(quote.previousClose)}</span>
              </span>
            )}
            {updatedChileTime && (
              <span className="whitespace-nowrap">
                <span className="text-muted-foreground">Act. </span>
                <span className="text-zinc-300">{updatedChileTime} CL</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={refresh}
            disabled={isRefreshing}
            aria-label="Actualizar MSCI EM Net USD"
            title="Actualizar cotización"
            className="inline-flex items-center justify-center min-h-[36px] min-w-[36px] rounded-lg border border-border bg-white/[0.03] hover:border-border-strong hover:bg-white/[0.06] text-zinc-300 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
          </button>

          <a
            href={MSCI_EM_YAHOO_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Abrir MSCI EM Net USD en Yahoo Finance"
            title="Ver en Yahoo Finance"
            className="inline-flex items-center justify-center min-h-[36px] min-w-[36px] rounded-lg border border-border bg-white/[0.03] hover:border-border-strong hover:bg-white/[0.06] text-zinc-300 hover:text-white transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
});

MsciEmStrip.displayName = 'MsciEmStrip';
