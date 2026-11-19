import React from 'react';
import { Clock } from 'lucide-react';
import { LiveStatusSummary } from '../core/types';

export interface LiveStatusBarProps {
  summary: LiveStatusSummary;
  totalMarkets: number;
}

export const LiveStatusBar: React.FC<LiveStatusBarProps> = React.memo(({
  summary,
  totalMarkets
}) => {
  const { openMarkets, lunchMarkets, preMarketMarkets, isGlobalWeekend, nextBell } = summary;
  const hasOpen = openMarkets.length > 0;
  const hasPreMarket = preMarketMarkets.length > 0;
  const hasLunch = lunchMarkets.length > 0;

  const showAtChile = Boolean(
    nextBell?.atChileFormatted &&
      !nextBell.formattedCountdown.includes(nextBell.atChileFormatted)
  );

  return (
    <section
      aria-label="Estado actual del mercado"
      className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 sm:gap-3 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border border-border bg-card backdrop-blur-md shadow-neon"
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 min-w-0">
        {hasOpen ? (
          <>
            <span
              className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"
              aria-hidden="true"
            />
            <span className="text-xs font-semibold text-emerald-300 whitespace-nowrap">
              Abiertas ahora:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {openMarkets.map((market) => (
                <span
                  key={market.id}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 text-xs font-medium text-emerald-200 whitespace-nowrap"
                >
                  <span aria-hidden="true">{market.flag}</span>
                  <span>{market.name}</span>
                </span>
              ))}
            </div>
            <span className="font-mono text-xs text-muted-foreground tabular-nums whitespace-nowrap">
              ({openMarkets.length}/{totalMarkets})
            </span>

            {hasPreMarket && (
              <span className="inline-flex items-center gap-1 text-xs text-sky-300/90 whitespace-nowrap">
                <span className="text-zinc-600" aria-hidden="true">·</span>
                <span className="font-medium">Pre-apertura:</span>
                <span>{preMarketMarkets.map((m) => `${m.flag} ${m.name}`).join(', ')}</span>
              </span>
            )}

            {hasLunch && (
              <span className="inline-flex items-center gap-1 text-xs text-amber-300/90 whitespace-nowrap">
                <span className="text-zinc-600" aria-hidden="true">·</span>
                <span className="font-medium">Almuerzo:</span>
                <span>{lunchMarkets.map((m) => `${m.flag} ${m.name}`).join(', ')}</span>
              </span>
            )}
          </>
        ) : hasPreMarket || hasLunch ? (
          <>
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                hasPreMarket ? 'bg-sky-400' : 'bg-amber-400'
              }`}
              aria-hidden="true"
            />

            {hasPreMarket && (
              <>
                <span className="text-xs font-semibold text-sky-300 whitespace-nowrap">
                  Pre-apertura:
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {preMarketMarkets.map((market) => (
                    <span
                      key={market.id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-sky-500/30 bg-sky-500/10 text-xs font-medium text-sky-200 whitespace-nowrap"
                    >
                      <span aria-hidden="true">{market.flag}</span>
                      <span>{market.name}</span>
                    </span>
                  ))}
                </div>
              </>
            )}

            {hasPreMarket && hasLunch && (
              <span className="text-zinc-600" aria-hidden="true">·</span>
            )}

            {hasLunch && (
              <>
                <span className="text-xs font-semibold text-amber-300 whitespace-nowrap">
                  Almuerzo:
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {lunchMarkets.map((market) => (
                    <span
                      key={market.id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-amber-500/30 bg-amber-500/10 text-xs font-medium text-amber-200 whitespace-nowrap"
                    >
                      <span aria-hidden="true">{market.flag}</span>
                      <span>{market.name}</span>
                    </span>
                  ))}
                </div>
              </>
            )}
          </>
        ) : isGlobalWeekend ? (
          <span className="inline-flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-zinc-500 shrink-0" aria-hidden="true" />
            <span className="text-xs font-medium text-zinc-300">
              Fin de semana · Bolsas cerradas
            </span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-zinc-500 shrink-0" aria-hidden="true" />
            <span className="text-xs font-medium text-zinc-300">
              Pausa entre sesiones · Sin bolsas abiertas
            </span>
          </span>
        )}
      </div>

      {nextBell && (
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs shrink-0 border-t border-border pt-2 md:border-t-0 md:pt-0 md:border-l md:pl-3.5">
          <Clock className="w-3.5 h-3.5 text-neon-sky shrink-0" aria-hidden="true" />
          <span className="text-muted-foreground whitespace-nowrap">Próxima campana:</span>
          <span className="font-medium text-zinc-100 whitespace-nowrap">
            <span aria-hidden="true">{nextBell.market.flag}</span> {nextBell.market.name}
          </span>
          <span className="font-mono font-semibold text-neon-sky tabular-nums whitespace-nowrap">
            {nextBell.formattedCountdown}
          </span>
          {showAtChile && (
            <span className="font-mono text-muted-foreground tabular-nums whitespace-nowrap">
              ({nextBell.atChileFormatted})
            </span>
          )}
        </div>
      )}
    </section>
  );
});

LiveStatusBar.displayName = 'LiveStatusBar';
