import React from 'react';
import { Flame, AlertCircle } from 'lucide-react';

export const TimelineLegend: React.FC = React.memo(() => {
  return (
    <div className="flex flex-wrap items-center justify-start md:justify-center gap-x-2.5 sm:gap-x-4 gap-y-1 sm:gap-y-1.5 border-t border-border pt-2 sm:pt-2.5 pb-0.5 text-[10px] sm:text-xs font-medium text-muted-foreground">
      <div className="flex items-center gap-1.5">
        <span className="w-2.5 h-2 rounded-xs bg-emerald-500" aria-hidden="true" />
        <span>Abierto</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-2.5 h-2 rounded-xs bg-emerald-500/20 border border-emerald-500/45" aria-hidden="true" />
        <span>Por abrir</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-2.5 h-2 rounded-xs bg-amber-500" aria-hidden="true" />
        <span>Almuerzo</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-2.5 h-2 rounded-xs bg-violet-950/80 border border-violet-500/45" aria-hidden="true" />
        <span>Feriado</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-3 h-[2px] rounded-xs bg-rose-500" aria-hidden="true" />
        <span>Ahora (Chile)</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-300 text-[10px] sm:text-[11px] font-semibold border border-rose-500/35">
          <Flame className="w-2.5 h-2.5 fill-current" aria-hidden="true" />
          <span>Impacto alto</span>
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 text-[10px] sm:text-[11px] font-semibold border border-amber-500/35">
          <AlertCircle className="w-2.5 h-2.5" aria-hidden="true" />
          <span>Impacto medio</span>
        </span>
      </div>
    </div>
  );
});

TimelineLegend.displayName = 'TimelineLegend';
