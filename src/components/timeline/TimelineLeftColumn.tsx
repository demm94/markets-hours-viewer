import React from 'react';
import { motion } from 'framer-motion';
import { Globe } from 'lucide-react';
import { MarketConfig, MarketEvaluation, MarketStatus } from '../../core/types';
import { Badge } from '../ui/badge';

const STATUS_LABELS: Record<MarketStatus, string> = {
  open: 'Abierto',
  lunch: 'Almuerzo',
  pre_market: 'Pre-apertura',
  closed: 'Cerrado'
};

interface TimelineLeftColumnProps {
  allMarkets: MarketConfig[];
  isColumnCollapsed: boolean;
  scrubberEvaluations: Record<string, MarketEvaluation>;
  chileScrubberEvaluation: MarketEvaluation;
}

export const TimelineLeftColumn: React.FC<TimelineLeftColumnProps> = React.memo(({
  allMarkets,
  isColumnCollapsed,
  scrubberEvaluations,
  chileScrubberEvaluation
}) => {
  const getStatusBadge = (marketId: string, evaluation: MarketEvaluation) => {
    const holiday = evaluation.holiday;
    const isFullHoliday = Boolean(holiday && !holiday.isEarlyClose);
    if (marketId === 'chile') {
      if (isFullHoliday && holiday) {
        return (
          <Badge
            variant="holiday"
            showDot={false}
            className="text-[10px] px-1.5 py-0.5 border-purple-400/40 text-purple-300 font-mono font-bold leading-none"
            title={`Feriado en Chile: ${holiday.name}`}
          >
            Feriado
          </Badge>
        );
      }
      return (
        <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 border-sky-400/40 text-sky-300 font-mono font-bold leading-none">
          Ref
        </Badge>
      );
    }
    if (isFullHoliday && holiday) {
      return (
        <Badge
          variant="holiday"
          showDot={false}
          className="text-[10px] px-1.5 py-0.5 font-mono font-bold leading-none"
          title={`Feriado bursátil: ${holiday.name}`}
        >
          Feriado
        </Badge>
      );
    }
    const variant =
      evaluation.status === 'open'
        ? 'open'
        : evaluation.status === 'lunch'
        ? 'lunch'
        : evaluation.status === 'pre_market'
        ? 'pre'
        : 'closed';

    return (
      <Badge variant={variant} showDot={false} className="text-[10px] px-1.5 py-0.5 font-mono font-bold leading-none">
        {STATUS_LABELS[evaluation.status] ?? 'Cerrado'}
      </Badge>
    );
  };

  return (
    <motion.div
      layout
      className={`timeline-left-column sticky left-0 bg-card border-r border-border shadow-[4px_0_16px_rgba(0,0,0,0.45)] flex flex-col z-30 transition-[width,min-width] duration-200 ease-out ${
        isColumnCollapsed
          ? 'w-11 min-w-[44px] sm:w-14 sm:min-w-[56px]'
          : 'w-[96px] min-w-[96px] sm:w-52 sm:min-w-[208px] md:w-[252px] md:min-w-[252px]'
      }`}
    >
      <div
        className={`h-9 sm:h-11 flex items-center border-b border-border bg-muted font-mono text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-muted-foreground ${
          isColumnCollapsed ? 'justify-center px-0' : 'justify-between px-2.5 sm:px-3'
        }`}
      >
        {isColumnCollapsed ? (
          <Globe size={14} className="text-zinc-400" aria-hidden="true" />
        ) : (
          <>
            <span className="text-[10px] sm:text-[11px] font-semibold">Mercado</span>
            <span className="hidden sm:inline text-[10px] font-normal text-zinc-400">Hora local</span>
          </>
        )}
      </div>

      {allMarkets.map((market) => {
        const isChile = market.id === 'chile';
        const ev = isChile
          ? chileScrubberEvaluation
          : (scrubberEvaluations[market.id] ?? {
              marketId: market.id,
              status: 'closed',
              localTimeFormatted: '--:--',
              localDateFormatted: ''
            });
        const holiday = ev.holiday;
        const isHoliday = Boolean(holiday && !holiday.isEarlyClose && !isChile);
        const spanishStatus = STATUS_LABELS[ev.status] ?? 'Cerrado';

        return (
          <motion.div
            layout
            key={market.id}
            className={`h-[38px] sm:h-[46px] md:h-[50px] flex items-center border-b border-border transition-colors ${
              isChile ? 'bg-white/[0.02]' : 'hover:bg-white/[0.02]'
            } ${isHoliday ? 'opacity-75' : ''} ${isColumnCollapsed ? 'justify-center px-0' : 'justify-between px-2 sm:px-3'}`}
            title={
              isColumnCollapsed
                ? `${market.name} (${market.code}) — ${ev.localTimeFormatted}${
                    holiday
                      ? isChile
                        ? ` · Feriado en Chile: ${holiday.name}`
                        : ` · Feriado: ${holiday.name}`
                      : ev.nextTransition
                      ? ` · ${ev.nextTransition.formattedCountdown}`
                      : ''
                  }`
                : isChile && holiday
                ? `Chile: Feriado (${holiday.name})`
                : undefined
            }
            aria-label={`${market.name}: ${
              holiday
                ? `Feriado (${holiday.name})`
                : isChile
                ? 'Eje de referencia 24h'
                : spanishStatus
            }`}
          >
            <div className={`flex items-center ${isColumnCollapsed ? 'justify-center gap-0' : 'gap-1.5 sm:gap-2'} min-w-0`}>
              <span
                aria-hidden="true"
                className={`leading-none select-none flex-shrink-0 ${isColumnCollapsed ? 'text-lg sm:text-xl' : 'text-sm sm:text-lg'}`}
              >
                {market.flag}
              </span>
              {!isColumnCollapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] sm:text-xs font-semibold text-zinc-100 whitespace-nowrap hidden sm:inline">
                    {market.name}
                  </span>
                  <span className="text-[10px] font-medium text-muted-foreground font-mono leading-none whitespace-nowrap hidden sm:inline">
                    {market.code}
                  </span>

                  <div className="flex items-center gap-1 sm:hidden">
                    <span className="text-[10px] font-bold text-zinc-100 font-mono leading-none tracking-tight">
                      {market.code.split(' ')[0]}
                    </span>
                    <span
                      className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        isChile && holiday
                          ? 'bg-violet-400'
                          : isChile
                          ? 'bg-sky-400'
                          : isHoliday
                          ? 'bg-violet-400'
                          : ev.status === 'open'
                          ? 'bg-emerald-400'
                          : ev.status === 'lunch'
                          ? 'bg-amber-400'
                          : ev.status === 'pre_market'
                          ? 'bg-sky-400'
                          : 'bg-zinc-600'
                      }`}
                    />
                  </div>
                  <span className="font-mono text-[10px] font-medium text-muted-foreground tabular-nums leading-none mt-0.5 sm:hidden">
                    {ev.localTimeFormatted}
                  </span>
                </div>
              )}
            </div>

            {!isColumnCollapsed && (
              <div className="hidden sm:flex flex-col items-end justify-center gap-1 flex-shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs md:text-sm font-bold text-zinc-100 tabular-nums leading-none">
                    {ev.localTimeFormatted}
                  </span>
                  {getStatusBadge(market.id, ev)}
                </div>
                {ev.nextTransition?.formattedCountdown && (
                  <span className="text-[10px] font-mono text-muted-foreground leading-none tabular-nums whitespace-nowrap">
                    {ev.nextTransition.formattedCountdown}
                  </span>
                )}
              </div>
            )}
          </motion.div>
        );
      })}
    </motion.div>
  );
});

TimelineLeftColumn.displayName = 'TimelineLeftColumn';
