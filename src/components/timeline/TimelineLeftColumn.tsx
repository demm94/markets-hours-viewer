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
    if (marketId === 'chile') {
      return (
        <Badge variant="outline" className="text-[9px] sm:text-[10px] px-1.5 sm:px-2.5 py-0.5 min-h-[18px] sm:min-h-[20px] border-sky-400/40 text-sky-300 font-mono leading-none">
          Referencia
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
      <Badge variant={variant} showDot={false} className="text-[9px] sm:text-[10px] px-1.5 sm:px-2.5 py-0.5 min-h-[18px] sm:min-h-[20px] font-mono font-bold leading-none">
        {text}
      </Badge>
    );
  };

  return (
    <motion.div
      layout
      className={`timeline-left-column sticky left-0 bg-[#080c16] border-r border-white/10 shadow-[6px_0_20px_rgba(0,0,0,0.7)] flex flex-col z-10 transition-[width,min-width] duration-200 ease-out ${
        isColumnCollapsed ? 'w-12 min-w-[48px] sm:w-14 sm:min-w-[56px]' : 'w-[190px] min-w-[190px] sm:w-[240px] sm:min-w-[240px] md:w-[270px] md:min-w-[270px]'
      }`}
    >
      <div
        className={`h-9 sm:h-11 flex items-center border-b border-white/10 bg-[#060912] font-mono text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 ${
          isColumnCollapsed ? 'justify-center px-0' : 'justify-between px-2.5 sm:px-3.5'
        }`}
      >
        {!isColumnCollapsed && <span>Mercado</span>}
        <motion.button
          type="button"
          onClick={onToggleColumn}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          className="relative inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-md bg-white/5 border border-white/10 text-slate-300 hover:bg-sky-400/20 hover:border-sky-400/40 hover:text-sky-400 transition-colors cursor-pointer before:absolute before:-inset-2 before:content-['']"
          title={isColumnCollapsed ? 'Expandir columna de mercados' : 'Colapsar a solo banderas'}
          aria-label={isColumnCollapsed ? 'Expandir columna' : 'Colapsar columna'}
        >
          {isColumnCollapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </motion.button>
      </div>

      {allMarkets.map((market) => {
        const isChile = market.id === 'chile';
        const ev = isChile ? chileScrubberEvaluation : (scrubberEvaluations[market.id] ?? {
          marketId: market.id,
          status: 'closed',
          localTimeFormatted: '--:--',
          localDateFormatted: ''
        });

        return (
          <motion.div
            layout
            key={market.id}
            className={`h-[38px] sm:h-[46px] md:h-[50px] flex items-center border-b border-white/5 transition-colors ${
              isChile
                ? 'bg-gradient-to-r from-sky-400/[0.12] to-sky-400/[0.04] border-b-sky-400/35'
                : 'hover:bg-white/[0.02]'
            } ${isColumnCollapsed ? 'justify-center px-0' : 'justify-between px-2.5 sm:px-4'}`}
            title={isColumnCollapsed ? `${market.name} (${market.code}) - ${ev.localTimeFormatted}` : undefined}
          >
            <div className={`flex items-center ${isColumnCollapsed ? 'justify-center gap-0' : 'gap-2'}`}>
              <span className={`leading-none filter drop-shadow select-none ${isColumnCollapsed ? 'text-lg sm:text-2xl' : 'text-base sm:text-xl'}`}>
                {market.flag}
              </span>
              {!isColumnCollapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] sm:text-xs font-bold text-white whitespace-nowrap truncate">{market.name}</span>
                  <span className="text-[9px] sm:text-[10px] font-semibold text-slate-400 font-mono leading-none">{market.code}</span>
                </div>
              )}
            </div>

            {!isColumnCollapsed && (
              <div className="flex flex-col items-end gap-0.5">
                <span className="font-mono text-xs sm:text-sm font-extrabold text-white tabular-nums leading-none">{ev.localTimeFormatted}</span>
                {getStatusBadge(market.id, ev)}
              </div>
            )}
          </motion.div>
        );
      })}
    </motion.div>
  );
});

TimelineLeftColumn.displayName = 'TimelineLeftColumn';
