import React from 'react';
import { DateTime } from 'luxon';
import { Activity, Calendar } from 'lucide-react';
import { Badge } from './ui/badge';
import { getSantiagoOffsetDescription } from '../core/timezone';

interface HeaderProps {
  now: DateTime;
  timeFormatted: string;
  dateFormatted: string;
  openMarketsCount: number;
  totalMarketsCount: number;
  onOpenEvents?: () => void;
  hasUpcomingCatalysts?: boolean;
}

export const Header: React.FC<HeaderProps> = React.memo(({
  now,
  timeFormatted,
  dateFormatted,
  openMarketsCount,
  totalMarketsCount,
  onOpenEvents,
  hasUpcomingCatalysts
}) => {
  const santiagoOffset = getSantiagoOffsetDescription(now);

  return (
    <header className="flex flex-col md:flex-row md:justify-between items-stretch md:items-center gap-2 sm:gap-3 md:gap-5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border border-border bg-card backdrop-blur-md shadow-neon relative overflow-hidden">
      <div className="flex items-center justify-between w-full md:w-auto gap-1.5 sm:gap-3.5 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <img src="/favicon.svg" alt="Markets View Logo" className="w-5 h-5 sm:w-5 sm:h-5 rounded shrink-0" width="20" height="20" />
          <h1 className="text-sm sm:text-base font-bold tracking-tight text-zinc-100 whitespace-nowrap truncate">
            Markets View
          </h1>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <Badge variant="open" showDot={false} className="min-h-[32px] sm:min-h-[34px] gap-1.5 px-2.5 py-1 text-[10px] sm:text-xs font-medium whitespace-nowrap">
            <Activity size={11} className="text-emerald-400 shrink-0" />
            <span>
              <strong className="text-emerald-300 font-semibold tabular-nums">{openMarketsCount}</strong>/{totalMarketsCount}
              <span className="hidden min-[360px]:inline"> abiertos</span>
            </span>
          </Badge>

          {onOpenEvents && (
            <button
              type="button"
              onClick={onOpenEvents}
              className="relative flex items-center gap-1.5 min-h-[32px] sm:min-h-[34px] px-2.5 sm:px-3 py-1 rounded-md border border-border bg-white/[0.03] hover:border-border-strong hover:bg-white/[0.06] hover:text-white active:bg-white/[0.08] text-[10px] sm:text-xs font-medium text-zinc-200 transition-colors duration-150 cursor-pointer whitespace-nowrap"
              title="Ver próximos eventos y catalizadores"
            >
              <Calendar className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span>Eventos</span>
              {hasUpcomingCatalysts && (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              )}
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between w-full md:w-auto gap-1.5 sm:gap-3 md:gap-3.5 bg-muted border border-border rounded-lg px-2.5 py-1 sm:px-3 sm:py-1.5">
        <div className="flex items-center gap-1.5 font-mono text-xs font-medium text-zinc-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-zinc-200 font-semibold">Santiago</span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="font-mono text-sm sm:text-base font-bold text-zinc-100 tracking-tight tabular-nums">
            {timeFormatted}
          </span>
          <span className="font-mono text-[10px] sm:text-[11px] font-medium text-zinc-300 bg-white/[0.04] border border-border px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded whitespace-nowrap leading-none">
            {santiagoOffset}
          </span>
        </div>

        <span className="text-[10px] sm:text-xs font-medium text-muted-foreground capitalize whitespace-nowrap">
          {dateFormatted}
        </span>
      </div>
    </header>
  );
});

Header.displayName = 'Header';
