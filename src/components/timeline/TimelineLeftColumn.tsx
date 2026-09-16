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
        <Badge variant="outline" className="text-[10px] px-2.5 py-0.5 min-h-[20px] border-sky-400/40 text-sky-300 font-mono leading-none">
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
        ? 'Pre-apertura'
        : evaluation.activeSegmentLabel === 'Fin de semana'
        ? 'Fin de sem.'
        : 'Cerrado';

    return (
      <Badge variant={variant} showDot={false} className="text-[10px] px-2.5 py-0.5 min-h-[20px] font-mono font-bold leading-none">
        {text}
      </Badge>
    );
  };

  return (
    <motion.div
      layout
      className={`timeline-left-column sticky left-0 bg-[#080c16] border-r border-white/10 shadow-[6px_0_20px_rgba(0,0,0,0.7)] flex flex-col z-10 transition-[width,min-width] duration-200 ease-out ${
        isColumnCollapsed ? 'w-14 min-w-[56px]' : 'w-[270px] min-w-[270px]'
      }`}
    >
      <div
        className={`h-11 flex items-center border-b border-white/10 bg-[#060912] font-mono text-[11px] font-bold uppercase tracking-wider text-slate-400 ${
          isColumnCollapsed ? 'justify-center px-0' : 'justify-between px-3.5'
        }`}
      >
        {!isColumnCollapsed && <span>Mercado</span>}
        <motion.button
          type="button"
          onClick={onToggleColumn}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          className="inline-flex items-center justify-center bg-white/5 border border-white/10 text-slate-300 rounded-lg min-w-[44px] min-h-[44px] hover:bg-sky-400/20 hover:border-sky-400/40 hover:text-sky-400 transition-colors cursor-pointer"
          title={isColumnCollapsed ? 'Expandir columna de mercados' : 'Colapsar a solo banderas'}
          aria-label={isColumnCollapsed ? 'Expandir columna' : 'Colapsar columna'}
        >
          {isColumnCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
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
            className={`h-[50px] flex items-center border-b border-white/5 transition-colors ${
              isChile
                ? 'bg-gradient-to-r from-sky-400/[0.12] to-sky-400/[0.04] border-b-sky-400/35'
                : 'hover:bg-white/[0.02]'
            } ${isColumnCollapsed ? 'justify-center px-0' : 'justify-between px-4'}`}
            title={isColumnCollapsed ? `${market.name} (${market.code}) - ${ev.localTimeFormatted}` : undefined}
          >
            <div className={`flex items-center ${isColumnCollapsed ? 'justify-center gap-0' : 'gap-2.5'}`}>
              <span className={`leading-none filter drop-shadow select-none ${isColumnCollapsed ? 'text-2xl' : 'text-xl'}`}>
                {market.flag}
              </span>
              {!isColumnCollapsed && (
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white whitespace-nowrap">{market.name}</span>
                  <span className="text-[10px] font-semibold text-slate-400 font-mono">{market.code}</span>
                </div>
              )}
            </div>

            {!isColumnCollapsed && (
              <div className="flex flex-col items-end gap-1">
                <span className="font-mono text-sm font-extrabold text-white tabular-nums">{ev.localTimeFormatted}</span>
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
