import React from 'react';
import { motion, type Variants } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { MarketConfig, MarketEvaluation } from '../core/types';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';

interface MarketCardsProps {
  markets: MarketConfig[];
  evaluations: Record<string, MarketEvaluation>;
  onSelectMarketEvents?: (marketId: string) => void;
  catalystsMap?: Record<string, boolean>;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 12, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 350,
      damping: 25
    }
  }
};

export const MarketCards: React.FC<MarketCardsProps> = React.memo(({
  markets,
  evaluations,
  onSelectMarketEvents,
  catalystsMap
}) => {
  return (
    <>
      {/* Mobile Condensed Strip (All 5 markets visible at a glance) */}
      <div className="grid grid-cols-5 gap-1 sm:gap-1.5 md:hidden">
        {markets.map((market) => {
          const ev = evaluations[market.id];
          const status = ev?.status ?? 'closed';
          const hasCatalyst = catalystsMap?.[market.id];

          let borderClass = 'border-white/10 bg-slate-900/80 text-slate-400';
          let dotColor = 'bg-slate-500';
          let statusLabel = 'Cerrado';

          if (status === 'open') {
            borderClass = 'border-emerald-500/40 bg-emerald-950/25 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.15)]';
            dotColor = 'bg-emerald-400 animate-pulse';
            statusLabel = 'Abierto';
          } else if (status === 'lunch') {
            borderClass = 'border-amber-500/40 bg-amber-950/20 text-amber-400';
            dotColor = 'bg-amber-400';
            statusLabel = 'Almuerzo';
          } else if (status === 'pre_market') {
            borderClass = 'border-cyan-500/40 bg-cyan-950/20 text-cyan-400';
            dotColor = 'bg-cyan-400';
            statusLabel = 'Pre';
          }

          return (
            <div
              key={market.id}
              onClick={() => onSelectMarketEvents?.(market.id)}
              className={cn(
                "relative flex flex-col items-center justify-between p-1 sm:p-1.5 rounded-lg border transition-all min-h-[50px] cursor-pointer hover:border-white/20 active:scale-95",
                borderClass
              )}
              title={`${market.name} (${market.code}) - ${statusLabel} - ${ev?.localTimeFormatted ?? '--:--'}${hasCatalyst ? ' (Evento hoy)' : ''}`}
            >
              {hasCatalyst && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shadow-[0_0_4px_#f43f5e]" />
              )}
              <div className="flex items-center gap-1 leading-none">
                <span className="text-xs select-none">{market.flag}</span>
                <span className="text-[9px] font-mono font-bold tracking-tight text-slate-300">
                  {market.code.split(' ')[0]}
                </span>
              </div>
              <span className="font-mono text-xs font-black text-white tabular-nums tracking-tight leading-none my-0.5">
                {ev?.localTimeFormatted ?? '--:--'}
              </span>
              <div className="flex items-center gap-1 leading-none">
                <span className={cn("w-1.5 h-1.5 rounded-full", dotColor)} />
                <span className="text-[9px] font-semibold leading-none truncate max-w-[45px]">
                  {statusLabel}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Rich Cards */}
      <motion.div
        className="hidden md:grid md:grid-cols-3 lg:grid-cols-5 gap-3.5 lg:gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {markets.map((market) => {
          const ev = evaluations[market.id];
          const status = ev?.status ?? 'closed';

          const badgeVariant =
            status === 'open'
              ? 'open'
              : status === 'lunch'
              ? 'lunch'
              : status === 'pre_market'
              ? 'pre'
              : 'closed';

          const statusText =
            status === 'open'
              ? 'Abierto'
              : status === 'lunch'
              ? 'Almuerzo'
              : status === 'pre_market'
              ? 'Pre-apertura'
              : 'Cerrado';

          let cardBorderClass = 'border-l-slate-600';
          let cardBgClass = 'bg-gradient-to-br from-slate-900/75 to-slate-950/90';

          if (status === 'open') {
            cardBorderClass = 'border-l-emerald-500 shadow-[0_0_18px_-6px_rgba(16,185,129,0.2)]';
            cardBgClass = 'bg-gradient-to-br from-emerald-950/20 via-slate-900/80 to-slate-950/90';
          } else if (status === 'lunch') {
            cardBorderClass = 'border-l-amber-500';
            cardBgClass = 'bg-gradient-to-br from-amber-950/15 via-slate-900/80 to-slate-950/90';
          } else if (status === 'pre_market') {
            cardBorderClass = 'border-l-cyan-500';
            cardBgClass = 'bg-gradient-to-br from-cyan-950/15 via-slate-900/80 to-slate-950/90';
          }

          return (
            <motion.div 
              key={market.id}
              variants={cardVariants}
              whileHover={{ scale: 1.02, transition: { duration: 0.15 } }}
              whileTap={{ scale: 0.98 }}
              layout
            >
              <Card
                className={cn(
                  "border-l-[3px] rounded-xl p-3.5 sm:p-4 flex flex-col justify-between gap-3 transition-colors overflow-hidden h-full shadow-lg",
                  cardBorderClass,
                  cardBgClass
                )}
                title={`${market.name} (${market.code}) - ${statusText} - ${ev?.localTimeFormatted ?? '--:--'}`}
              >
                {/* Row 1: Flag + Country Name + Exchange on left, Status Badge on right */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xl leading-none select-none shrink-0">{market.flag}</span>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-white tracking-tight leading-tight truncate">
                        {market.name}
                      </div>
                      <div className="text-[10px] font-mono font-semibold text-slate-400 tracking-wider uppercase">
                        {market.code}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {onSelectMarketEvents && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectMarketEvents(market.id);
                        }}
                        className="relative flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold text-slate-400 hover:text-sky-300 hover:bg-white/5 transition-colors cursor-pointer"
                        title="Ver eventos de este mercado"
                      >
                        <Calendar className="w-3 h-3" />
                        <span className="hidden xl:inline">Eventos</span>
                        {catalystsMap?.[market.id] && (
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shadow-[0_0_4px_#f43f5e]" />
                        )}
                      </button>
                    )}
                    <Badge variant={badgeVariant} className="px-2.5 py-0.5 text-[11px] font-semibold shrink-0">
                      {statusText}
                    </Badge>
                  </div>
                </div>

                {/* Row 2: Local Time (prominent) on left, Date & Timezone on right */}
                <div className="flex items-end justify-between gap-2 pt-2 border-t border-white/5">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block leading-none mb-1">
                      Hora local
                    </span>
                    <span className="font-mono text-xl sm:text-2xl font-black text-white tabular-nums tracking-tight leading-none">
                      {ev?.localTimeFormatted ?? '--:--'}
                    </span>
                  </div>
                  <div className="flex flex-col items-end text-right min-w-0">
                    <span className="font-mono text-xs font-semibold text-slate-300 leading-none">
                      {ev?.localDateFormatted}
                    </span>
                    <span className="font-mono text-[10px] text-slate-500 truncate max-w-[110px] mt-1 leading-none" title={market.timezone}>
                      {market.timezone.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>
    </>
  );
});

MarketCards.displayName = 'MarketCards';
