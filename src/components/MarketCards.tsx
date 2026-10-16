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
      <div className="grid grid-cols-5 gap-1.5 md:hidden">
        {markets.map((market) => {
          const ev = evaluations[market.id];
          const status = ev?.status ?? 'closed';
          const isHoliday = Boolean(ev?.holiday);
          const hasCatalyst = catalystsMap?.[market.id];

          let borderClass = 'border-border bg-card text-zinc-400';
          let dotColor = 'bg-zinc-600';
          let statusLabel = 'Cerrado';

          if (isHoliday) {
            borderClass = 'border-violet-500/35 bg-violet-500/[0.05] text-violet-300';
            dotColor = 'bg-violet-400';
            statusLabel = 'Feriado';
          } else if (status === 'open') {
            borderClass = 'border-emerald-500/35 bg-emerald-500/[0.05] text-emerald-400';
            dotColor = 'bg-emerald-400 animate-pulse';
            statusLabel = 'Abierto';
          } else if (status === 'lunch') {
            borderClass = 'border-amber-500/35 bg-amber-500/[0.05] text-amber-400';
            dotColor = 'bg-amber-400';
            statusLabel = 'Almuerzo';
          } else if (status === 'pre_market') {
            borderClass = 'border-sky-500/35 bg-sky-500/[0.05] text-sky-400';
            dotColor = 'bg-sky-400';
            statusLabel = 'Pre';
          }

          return (
            <button
              type="button"
              key={market.id}
              onClick={() => onSelectMarketEvents?.(market.id)}
              className={cn(
                "relative flex flex-col items-center justify-between p-1.5 rounded-lg border transition-colors duration-150 min-h-[60px] w-full text-center cursor-pointer hover:border-border-strong active:scale-98 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400",
                borderClass
              )}
              title={`${market.name} (${market.code}) - ${isHoliday ? `Feriado: ${ev?.holiday?.name}` : statusLabel} - ${ev?.localTimeFormatted ?? '--:--'} (${ev?.timezoneOffset ?? ''})${hasCatalyst ? ' (Evento hoy)' : ''}`}
              aria-label={`${market.name} (${market.code}), ${isHoliday ? `Feriado: ${ev?.holiday?.name}` : statusLabel}, hora local ${ev?.localTimeFormatted ?? '--:--'} ${ev?.timezoneOffset ?? ''}${hasCatalyst ? ', tiene evento hoy' : ''}`}
            >
              {hasCatalyst && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-rose-500" aria-hidden="true" />
              )}
              <div className="flex items-center gap-1 leading-none">
                <span className="text-xs select-none" aria-hidden="true">{market.flag}</span>
                <span className="text-xs font-mono font-semibold tracking-tight text-zinc-300">
                  {market.code.split(' ')[0]}
                </span>
              </div>
              <div className="flex flex-col items-center leading-none my-0.5 gap-0.5">
                <span className="font-mono text-xs font-bold text-zinc-100 tabular-nums tracking-tight">
                  {ev?.localTimeFormatted ?? '--:--'}
                </span>
                {ev?.timezoneOffset && (
                  <span className="font-mono text-[10px] font-medium text-muted-foreground leading-none">
                    {ev.timezoneOffset}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 leading-none">
                <span className={cn("w-1.5 h-1.5 rounded-full", dotColor)} aria-hidden="true" />
                <span className="text-[11px] font-medium leading-none truncate max-w-[56px]">
                  {statusLabel}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Desktop Rich Cards */}
      <motion.div
        className="hidden md:grid md:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-3.5"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {markets.map((market) => {
          const ev = evaluations[market.id];
          const status = ev?.status ?? 'closed';
          const isHoliday = Boolean(ev?.holiday);

          const badgeVariant = isHoliday
            ? 'holiday'
            : status === 'open'
            ? 'open'
            : status === 'lunch'
            ? 'lunch'
            : status === 'pre_market'
            ? 'pre'
            : 'closed';

          const statusText = isHoliday
            ? 'Feriado'
            : status === 'open'
            ? 'Abierto'
            : status === 'lunch'
            ? 'Almuerzo'
            : status === 'pre_market'
            ? 'Pre-apertura'
            : 'Cerrado';

          let cardStateClass = 'border-border bg-card hover:border-border-strong';

          if (isHoliday) {
            cardStateClass = 'border-violet-500/30 bg-gradient-to-b from-violet-500/[0.04] to-transparent hover:border-violet-500/45';
          } else if (status === 'open') {
            cardStateClass = 'border-emerald-500/30 bg-gradient-to-b from-emerald-500/[0.04] to-transparent hover:border-emerald-500/45';
          } else if (status === 'lunch') {
            cardStateClass = 'border-amber-500/30 bg-gradient-to-b from-amber-500/[0.04] to-transparent hover:border-amber-500/45';
          } else if (status === 'pre_market') {
            cardStateClass = 'border-sky-500/30 bg-gradient-to-b from-sky-500/[0.04] to-transparent hover:border-sky-500/45';
          }

          return (
            <motion.div 
              key={market.id}
              variants={cardVariants}
              layout
            >
              <Card
                className={cn(
                  "p-3.5 sm:p-4 flex flex-col justify-between gap-3.5 overflow-hidden h-full",
                  cardStateClass
                )}
                title={`${market.name} (${market.code}) - ${statusText} - ${ev?.localTimeFormatted ?? '--:--'}`}
              >
                {/* Row 1: Flag + Country Name + Exchange on left, Status Badge on right */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-lg leading-none select-none shrink-0">{market.flag}</span>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-zinc-100 tracking-tight leading-tight truncate">
                        {market.name}
                      </div>
                      <div className="text-xs font-mono font-medium text-muted-foreground tracking-wider uppercase mt-0.5">
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
                        className="relative flex items-center gap-1 min-h-[26px] px-2 py-0.5 rounded-md text-xs font-medium text-muted-foreground hover:text-zinc-100 hover:bg-white/[0.05] border border-transparent hover:border-border transition-colors duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                        title="Ver eventos de este mercado"
                        aria-label={`Ver eventos y catalizadores de ${market.name}`}
                      >
                        <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                        <span className="hidden xl:inline">Eventos</span>
                        {catalystsMap?.[market.id] && (
                           <span className="w-1.5 h-1.5 rounded-full bg-rose-500" aria-hidden="true" />
                        )}
                      </button>
                    )}
                    <Badge variant={badgeVariant} className="px-2 py-0.5 text-xs font-medium shrink-0">
                      {statusText}
                    </Badge>
                  </div>
                </div>

                {/* Holiday Banner if closed for holiday */}
                {ev?.holiday && (
                  <div
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-violet-500/10 border border-violet-500/25 text-xs text-violet-200 font-medium truncate"
                    title={`Feriado bursátil: ${ev.holiday.name}`}
                  >
                    <Calendar className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                    <span className="truncate">{ev.holiday.name}</span>
                  </div>
                )}

                {/* Row 2: Local Time (prominent) on left, Date & Timezone on right */}
                <div className="flex items-end justify-between gap-2 pt-2.5 border-t border-border">
                  <div>
                    <span className="text-xs uppercase font-medium text-muted-foreground tracking-wider block leading-none mb-1">
                      Hora local
                    </span>
                    <span className="font-mono text-xl sm:text-2xl font-bold text-zinc-100 tabular-nums tracking-tight leading-none">
                      {ev?.localTimeFormatted ?? '--:--'}
                    </span>
                  </div>
                  <div className="flex flex-col items-end text-right min-w-0">
                    <span className="font-mono text-xs font-medium text-zinc-300 leading-none">
                      {ev?.localDateFormatted}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground truncate max-w-[140px] mt-1 leading-none" title={`${market.timezone} (${ev?.timezoneOffset ?? ''})`}>
                      {market.timezone.replace('_', ' ')} · {ev?.timezoneOffset ?? ''}
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
