import React from 'react';
import { motion } from 'framer-motion';
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
    <header className="flex flex-col md:flex-row md:justify-between items-stretch md:items-center gap-1.5 sm:gap-3 md:gap-5 px-2.5 py-1.5 sm:px-4 sm:py-3 md:px-5 md:py-2.5 rounded-xl border border-white/10 bg-gradient-to-br from-slate-900/85 to-slate-950/95 backdrop-blur-xl shadow-xl relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-sky-400/35 to-transparent pointer-events-none" />
      
      <div className="flex items-center justify-between w-full md:w-auto gap-2 sm:gap-3.5">
        <div className="flex items-center gap-2 sm:gap-2.5">
          <img src="/favicon.svg" alt="Markets View Logo" className="w-5 h-5 sm:w-6 sm:h-6 rounded-md drop-shadow-[0_2px_5px_rgba(56,189,248,0.3)]" width="24" height="24" />
          <h1 className="text-sm sm:text-base md:text-lg font-extrabold tracking-tight bg-gradient-to-b from-white to-slate-300 bg-clip-text text-transparent whitespace-nowrap">
            Markets View
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <motion.div
            key={openMarketsCount}
            initial={{ scale: 0.92 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            <Badge variant="open" showDot={false} className="gap-1.5 sm:gap-2 px-2.5 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-semibold shadow-md">
              <Activity size={11} className="animate-pulse text-emerald-400 shrink-0" />
              <span>
                <strong className="text-emerald-300 font-bold">{openMarketsCount}</strong>/{totalMarketsCount} abiertos
              </span>
            </Badge>
          </motion.div>

          {onOpenEvents && (
            <button
              type="button"
              onClick={onOpenEvents}
              className="relative flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-md border border-white/10 bg-slate-800/80 hover:bg-slate-750 hover:text-white active:bg-slate-700 text-[10px] sm:text-xs font-semibold text-slate-200 transition-colors shadow-sm cursor-pointer"
              title="Ver próximos eventos y catalizadores"
            >
              <Calendar className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>Eventos</span>
              {hasUpcomingCatalysts && (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shadow-[0_0_6px_#f43f5e]" />
              )}
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between w-full md:w-auto gap-1.5 sm:gap-3 md:gap-4 bg-[#04070f]/85 border border-white/10 rounded-lg px-2.5 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 shadow-inner">
        <div className="flex items-center gap-1.5 sm:gap-2 font-mono text-xs font-semibold text-slate-300">
          <motion.span
            className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]"
            animate={{ scale: [1, 1.25, 1], opacity: [1, 0.65, 1] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <span className="text-slate-200 font-bold">Santiago</span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="font-mono text-sm sm:text-base md:text-lg font-extrabold text-white tracking-tight tabular-nums [text-shadow:0_0_16px_rgba(255,255,255,0.2)]">
            {timeFormatted}
          </span>
          <span className="font-mono text-[10px] sm:text-[11px] font-semibold text-sky-400 bg-sky-500/15 border border-sky-400/30 px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-md whitespace-nowrap shadow-sm leading-none">
            {santiagoOffset}
          </span>
        </div>

        <span className="text-[10px] sm:text-xs font-medium text-slate-400 capitalize whitespace-nowrap">
          {dateFormatted}
        </span>
      </div>
    </header>
  );
});

Header.displayName = 'Header';
