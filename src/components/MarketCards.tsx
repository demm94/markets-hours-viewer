import React from 'react';
import { motion, type Variants } from 'framer-motion';
import { MarketConfig, MarketEvaluation } from '../core/types';

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
      className="flex flex-row md:grid md:grid-cols-3 lg:grid-cols-5 overflow-x-auto md:overflow-x-visible snap-x snap-mandatory md:snap-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden gap-3 p-1 md:p-0 min-h-[104px]"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {markets.map((market) => {
        const ev = evaluations[market.id];
        const status = ev?.status ?? 'closed';

        let statusText = 'Cerrado';
        let statusBadgeClasses = 'bg-slate-800/40 text-slate-400 border-slate-700/40';
        let cardBorderClass = 'border-l-slate-600';
        let cardBgClass = 'bg-gradient-to-br from-slate-900/75 to-slate-950/90';

        if (status === 'open') {
          statusText = 'Abierto';
          statusBadgeClasses = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.2)]';
          cardBorderClass = 'border-l-emerald-500 shadow-[0_0_18px_-6px_rgba(16,185,129,0.2)]';
          cardBgClass = 'bg-gradient-to-br from-emerald-950/20 via-slate-900/80 to-slate-950/90';
        } else if (status === 'lunch') {
          statusText = 'Almuerzo';
          statusBadgeClasses = 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]';
          cardBorderClass = 'border-l-amber-500';
          cardBgClass = 'bg-gradient-to-br from-amber-950/15 via-slate-900/80 to-slate-950/90';
        } else if (status === 'pre_market') {
          statusText = 'Pre-apertura';
          statusBadgeClasses = 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.2)]';
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
            className={`flex-shrink-0 flex-grow-0 basis-[clamp(210px,64vw,270px)] md:basis-auto snap-start border border-white/10 border-l-[3px] rounded-2xl p-3.5 flex flex-col gap-2 backdrop-blur-xl shadow-lg transition-colors overflow-hidden ${cardBorderClass} ${cardBgClass}`}
            title={`${market.name} (${market.code}) - ${statusText} - ${ev?.localTimeFormatted ?? '--:--'}`}
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <span className="text-2xl leading-none drop-shadow-md">{market.flag}</span>
                <div>
                  <div className="text-sm font-bold text-white tracking-tight">{market.name}</div>
                  <div className="text-[10px] font-semibold text-slate-400 font-mono">{market.code}</div>
                </div>
              </div>
              <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${statusBadgeClasses}`}>
                <span className={`w-1.5 h-1.5 rounded-full bg-current ${status === 'open' ? 'animate-pulse' : ''}`} />
                <span>{statusText}</span>
              </span>
            </div>

            <div className="flex items-baseline justify-between mt-1 px-2.5 py-1 bg-black/25 rounded-md border border-white/5">
              <span className="text-xs font-medium text-slate-400">Hora local:</span>
              <span className="font-mono text-base font-extrabold text-white tabular-nums tracking-tight">
                {ev?.localTimeFormatted ?? '--:--'}
              </span>
            </div>

            <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 border-t border-white/5 pt-1.5 mt-auto">
              <span>{market.timezone}</span>
              <span>{ev?.localDateFormatted}</span>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
});

MarketCards.displayName = 'MarketCards';
