import React from 'react';
import { motion } from 'framer-motion';
import { DateTime } from 'luxon';
import { Activity } from 'lucide-react';
import { Badge } from './ui/badge';
import { getSantiagoOffsetDescription } from '../core/timezone';

interface HeaderProps {
  now: DateTime;
  timeFormatted: string;
  dateFormatted: string;
  openMarketsCount: number;
  totalMarketsCount: number;
}

export const Header: React.FC<HeaderProps> = React.memo(({
  now,
  timeFormatted,
  dateFormatted,
  openMarketsCount,
  totalMarketsCount
}) => {
  const santiagoOffset = getSantiagoOffsetDescription(now);

  return (
    <header className="flex flex-col md:flex-row md:justify-between items-stretch md:items-center gap-2 md:gap-4 p-2.5 md:px-4 md:py-2.5 rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/85 to-slate-950/95 backdrop-blur-xl shadow-xl relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-sky-400/35 to-transparent pointer-events-none" />
      
      <div className="flex items-center justify-between w-full md:w-auto">
        <div className="flex items-center gap-2.5">
          <img src="/favicon.svg" alt="Markets View Logo" className="w-6 h-6 rounded-md drop-shadow-[0_2px_5px_rgba(56,189,248,0.3)]" width="24" height="24" />
          <h1 className="text-[clamp(0.95rem,3.8vw,1.15rem)] font-extrabold tracking-tight bg-gradient-to-b from-white to-slate-300 bg-clip-text text-transparent whitespace-nowrap">
            Markets View
          </h1>
        </div>
        <motion.div
          key={openMarketsCount}
          initial={{ scale: 0.92 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        >
          <Badge variant="open" showDot={false} className="gap-1.5 px-2 py-1 text-[clamp(0.68rem,2.8vw,0.72rem)]">
            <Activity size={12} className="animate-pulse text-emerald-400" />
            <span>
              <strong className="text-emerald-300 font-bold">{openMarketsCount}</strong>/{totalMarketsCount} abiertos
            </span>
          </Badge>
        </motion.div>
      </div>

      <div className="flex items-center justify-between w-full md:w-auto gap-2 bg-[#04070f]/65 border border-white/5 rounded-lg px-2.5 py-1.5 shadow-inner">
        <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-slate-300">
          <motion.span
            className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]"
            animate={{ scale: [1, 1.25, 1], opacity: [1, 0.65, 1] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <span className="text-slate-200">Santiago</span>
        </div>

        <span className="font-mono text-[clamp(0.92rem,3.4vw,1.05rem)] font-extrabold text-white tracking-tight tabular-nums [text-shadow:0_0_16px_rgba(255,255,255,0.2)]">
          {timeFormatted}
        </span>
        <span className="font-mono text-[clamp(0.62rem,2.4vw,0.68rem)] font-semibold text-sky-400 bg-sky-500/15 border border-sky-400/30 px-1.5 py-0.5 rounded whitespace-nowrap">
          {santiagoOffset}
        </span>
        <span className="text-[clamp(0.66rem,2.4vw,0.72rem)] font-medium text-slate-400 capitalize whitespace-nowrap">
          {dateFormatted}
        </span>
      </div>
    </header>
  );
});

Header.displayName = 'Header';
