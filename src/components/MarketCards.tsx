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
      className="flex flex-row md:grid md:grid-cols-3 lg:grid-cols-5 overflow-x-auto md:overflow-x-visible snap-x snap-mandatory md:snap-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden gap-4 lg:gap-5 p-1 md:p-0 min-h-[116px]"
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
            className="flex-shrink-0 flex-grow-0 basis-[clamp(240px,68vw,280px)] md:basis-auto snap-start"
          >
            <Card
              className={cn(
                "border-l-[4px] rounded-2xl p-4 sm:p-5 flex flex-col gap-3.5 transition-colors overflow-hidden h-full shadow-lg",
                cardBorderClass,
                cardBgClass
              )}
              title={`${market.name} (${market.code}) - ${statusText} - ${ev?.localTimeFormatted ?? '--:--'}`}
            >
              {/* Row 1: Flag & Code on Left, Status Badge on Right */}
              <div className="flex justify-between items-center gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl leading-none drop-shadow-md select-none">{market.flag}</span>
                  <span className="text-xs font-bold text-slate-400 font-mono tracking-wider">{market.code}</span>
                </div>
                <Badge variant={badgeVariant} className="px-2.5 py-0.5 text-xs font-semibold shrink-0">
                  {statusText}
                </Badge>
              </div>

              {/* Row 2: Full Country Name (never truncated) */}
              <div className="text-base font-bold text-white tracking-tight leading-snug">
                {market.name}
              </div>

              {/* Row 3: Local Time in prominent pill */}
              <div className="flex items-baseline justify-between px-3.5 py-2.5 bg-black/40 rounded-xl border border-white/5 my-0.5 shadow-inner">
                <span className="text-xs font-medium text-slate-400">Hora local:</span>
                <span className="font-mono text-lg font-extrabold text-white tabular-nums tracking-tight">
                  {ev?.localTimeFormatted ?? '--:--'}
                </span>
              </div>

              {/* Row 4: Timezone & Date */}
              <div className="flex justify-between items-center text-[11px] font-mono text-slate-400 border-t border-white/5 pt-2.5 mt-auto gap-2">
                <span className="truncate" title={market.timezone}>
                  {market.timezone.replace('_', ' ')}
                </span>
                <span className="shrink-0 text-slate-300 font-medium">
                  {ev?.localDateFormatted}
                </span>
              </div>
            </Card>
          </motion.div>
        );
      })}
    </motion.div>
  );
});

MarketCards.displayName = 'MarketCards';
