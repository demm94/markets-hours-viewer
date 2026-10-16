import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MarketConfig, MarketEvaluation } from '../../core/types';
import { Badge } from '../ui/badge';

interface TimelineLeftColumnProps {
  allMarkets: MarketConfig[];
  isColumnCollapsed: boolean;
  onToggleColumn: () => void;
  scrubberEvaluations: Record<string, MarketEvaluation>;
  chileScrubberEvaluation: MarketEvaluation;
}

export const TimelineLeftColumn: React.FC<TimelineLeftColumnProps> = React.memo(({
  allMarkets,
  isColumnCollapsed,
  onToggleColumn,
  scrubberEvaluations,
  chileScrubberEvaluation
}) => {
  const getStatusBadge = (marketId: string, evaluation: MarketEvaluation) => {
    const holiday = evaluation.holiday;
    if (marketId === 'chile') {
      if (holiday) {
        return (
          <Badge
            variant="holiday"
            showDot={false}
            className="text-[9px] md:text-[10px] px-1.5 py-0.5 border-purple-400/40 text-purple-300 font-mono font-bold leading-none"
            title={`Feriado en Chile: ${holiday.name}`}
          >
            Feriado
          </Badge>
        );
      }
      return (
        <Badge variant="outline" className="text-[9px] md:text-[10px] px-1.5 py-0.5 border-sky-400/40 text-sky-300 font-mono font-bold leading-none">
          Ref
        </Badge>
      );
    }
    if (holiday) {
      return (
        <Badge
          variant="holiday"
          showDot={false}
          className="text-[9px] md:text-[10px] px-1.5 py-0.5 font-mono font-bold leading-none"
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

    const text =
      evaluation.status === 'open'
        ? 'Abierto'
        : evaluation.status === 'lunch'
        ? 'Almuerzo'
        : evaluation.status === 'pre_market'
        ? 'Pre'
        : 'Cerrado';

    return (
      <Badge variant={variant} showDot={false} className="text-[9px] md:text-[10px] px-1.5 py-0.5 font-mono font-bold leading-none">
        {text}
      </Badge>
    );
  };

  return (
    <motion.div
      layout
      className={`timeline-left-column sticky left-0 bg-card border-r border-border shadow-[4px_0_16px_rgba(0,0,0,0.45)] flex flex-col z-10 transition-[width,min-width] duration-200 ease-out ${
        isColumnCollapsed
          ? 'w-11 min-w-[44px] sm:w-14 sm:min-w-[56px]'
          : 'w-[84px] min-w-[84px] sm:w-48 sm:min-w-[192px] md:w-56 md:min-w-[224px]'
      }`}
    >
      <div
        className={`h-9 sm:h-11 flex items-center border-b border-border bg-muted font-mono text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-muted-foreground ${
          isColumnCollapsed ? 'justify-center px-0' : 'justify-between px-2 sm:px-3'
        }`}
      >
        {!isColumnCollapsed && (
          <span className="text-[9px] sm:text-[11px] font-semibold">Mercado</span>
        )}
        <motion.button
          type="button"
          onClick={onToggleColumn}
          whileTap={{ scale: 0.95 }}
          className="relative inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-white/[0.03] border border-border text-zinc-300 hover:bg-white/[0.06] hover:border-border-strong hover:text-white transition-colors cursor-pointer before:absolute before:-inset-2 before:content-['']"
          title={isColumnCollapsed ? 'Expandir nombres y detalles de mercados' : 'Colapsar a solo banderas'}
          aria-label={isColumnCollapsed ? 'Expandir columna' : 'Colapsar columna'}
        >
          {isColumnCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </motion.button>
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
        const isHoliday = Boolean(holiday && !isChile);

        return (
          <motion.div
            layout
            key={market.id}
            className={`h-[38px] sm:h-[46px] md:h-[50px] flex items-center border-b border-border transition-colors ${
              isChile
                ? 'bg-white/[0.02]'
                : 'hover:bg-white/[0.02]'
            } ${isHoliday ? 'opacity-60' : ''} ${isColumnCollapsed ? 'justify-center px-0' : 'justify-between px-2 sm:px-3'}`}
            title={
              isColumnCollapsed
                ? `${market.name} (${market.code}) - ${ev.localTimeFormatted}${
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
                : ev.status
            }`}
          >
            <div className={`flex items-center ${isColumnCollapsed ? 'justify-center gap-0' : 'gap-1.5 sm:gap-2'} min-w-0`}>
              <span className={`leading-none select-none flex-shrink-0 ${isColumnCollapsed ? 'text-lg sm:text-xl' : 'text-sm sm:text-lg'}`}>
                {market.flag}
              </span>
              {!isColumnCollapsed && (
                <div className="flex flex-col min-w-0">
                  {/* Desktop: Name on top, Code below */}
                  <span className="text-[11px] sm:text-xs font-semibold text-zinc-100 whitespace-nowrap truncate hidden sm:inline">
                    {market.name}
                  </span>
                  <span className="text-[10px] font-medium text-muted-foreground font-mono leading-none hidden sm:inline">
                    {market.code}
                  </span>

                  {/* Mobile: Code on top with Status Dot, Time below */}
                  <div className="flex items-center gap-1 sm:hidden">
                    <span className="text-[9.5px] font-bold text-zinc-100 font-mono leading-none tracking-tight">
                      {market.code}
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
                  <span className="font-mono text-[9px] font-medium text-muted-foreground tabular-nums leading-none mt-0.5 sm:hidden">
                    {ev.localTimeFormatted}
                  </span>
                </div>
              )}
            </div>

            {/* Desktop right side: Line 1: Time + Status Badge | Line 2: Countdown */}
            {!isColumnCollapsed && (
              <div className="hidden sm:flex flex-col items-end justify-center gap-1 flex-shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs md:text-sm font-bold text-zinc-100 tabular-nums leading-none">
                    {ev.localTimeFormatted}
                  </span>
                  {getStatusBadge(market.id, ev)}
                </div>
                {ev.nextTransition?.formattedCountdown && (
                  <span className="text-[9px] font-mono text-muted-foreground leading-none tabular-nums whitespace-nowrap">
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
