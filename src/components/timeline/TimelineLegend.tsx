import React from 'react';
import { Flame, AlertCircle } from 'lucide-react';

export const TimelineLegend: React.FC = React.memo(() => {
  return (
    <div className="flex flex-wrap items-center justify-start md:justify-center gap-x-3 sm:gap-x-5 gap-y-1 sm:gap-y-1.5 border-t border-border pt-1.5 sm:pt-2.5 pb-0.5 text-[10px] sm:text-xs font-medium text-foreground/80 mt-0.5 sm:mt-1">
      <div className="flex items-center gap-1.5 sm:gap-2">
        <span className="w-2.5 h-2 sm:w-3.5 sm:h-2.5 rounded-sm bg-emerald-500 shadow-[0_0_0_1px_rgba(16,185,129,0.18),0_0_18px_-6px_rgba(16,185,129,0.55)]" />
        <span>Mercado Abierto</span>
      </div>
      <div className="flex items-center gap-1.5 sm:gap-2">
        <span className="w-2.5 h-2 sm:w-3.5 sm:h-2.5 rounded-sm bg-amber-500 shadow-[0_0_0_1px_rgba(245,158,11,0.18),0_0_18px_-6px_rgba(245,158,11,0.55)]" />
        <span>Almuerzo / Pre</span>
      </div>
      <div className="flex items-center gap-1.5 sm:gap-2">
        <span className="w-2.5 h-2 sm:w-3.5 sm:h-2.5 rounded-sm bg-secondary border border-border" />
        <span>Cerrado</span>
      </div>
      <div className="flex items-center gap-1.5 sm:gap-2">
        <span className="w-2.5 h-[2px] sm:w-3.5 sm:h-[2.5px] rounded-[1px] bg-rose-600 shadow-[0_0_0_1px_rgba(244,63,94,0.18),0_0_18px_-6px_rgba(244,63,94,0.55)]" />
        <span>Hora actual (Chile)</span>
      </div>
      <div className="flex items-center gap-1.5 sm:gap-2">
        <span className="w-2.5 h-[2px] sm:w-3.5 sm:h-[2.5px] rounded-[1px] bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.6)]" />
        <span>Cursor interactivo</span>
      </div>
      <div className="flex items-center gap-1.5 sm:gap-2">
        <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded-full bg-rose-600 text-white text-[9px] font-bold font-mono shadow-[0_0_8px_rgba(225,29,72,0.8)] border border-rose-300">
          <Flame className="w-2 h-2 fill-current" />
          <span>Alto</span>
        </span>
        <span>Impacto Alto</span>
      </div>
      <div className="flex items-center gap-1.5 sm:gap-2">
        <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded-full bg-amber-500 text-zinc-950 text-[9px] font-bold font-mono shadow-[0_0_8px_rgba(245,158,11,0.8)] border border-amber-200">
          <AlertCircle className="w-2 h-2" />
          <span>Medio</span>
        </span>
        <span>Impacto Medio</span>
      </div>
    </div>
  );
});

TimelineLegend.displayName = 'TimelineLegend';
