import React from 'react';
import { motion, type Variants } from 'framer-motion';
import { MarketConfig, MarketEvaluation } from '../core/types';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';

interface MarketCardsProps {
  markets: MarketConfig[];
  evaluations: Record<string, MarketEvaluation>;
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

export const MarketCards: React.FC<MarketCardsProps> = React.memo(({ markets, evaluations }) => {
  return (
    <motion.div
      className="flex flex-row md:grid md:grid-cols-3 lg:grid-cols-5 overflow-x-auto md:overflow-x-visible snap-x snap-mandatory md:snap-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden gap-3 sm:gap-3.5 lg:gap-4 p-1 md:p-0"
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
            className="flex-shrink-0 flex-grow-0 basis-[clamp(240px,65vw,280px)] md:basis-auto snap-start"
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
                <Badge variant={badgeVariant} className="px-2.5 py-0.5 text-[11px] font-semibold shrink-0">
                  {statusText}
                </Badge>
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
  );
});

MarketCards.displayName = 'MarketCards';
