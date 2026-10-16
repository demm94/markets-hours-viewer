import React from 'react';
import { Flame, AlertCircle } from 'lucide-react';

export const TimelineLegend: React.FC = React.memo(() => {
  return (
    <div className="flex flex-wrap items-center justify-start md:justify-center gap-x-4 sm:gap-x-5 gap-y-1.5 border-t border-border pt-2 sm:pt-2.5 pb-0.5 text-[10px] sm:text-xs font-medium text-muted-foreground mt-0.5">
      <div className="flex items-center gap-1.5">
        <span className="w-2.5 h-2 rounded-xs bg-emerald-500" />
        <span>Abierto (Activo)</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-2.5 h-2 rounded-xs bg-emerald-500/20 border border-emerald-500/45" />
        <span>Por abrir / Inactivo</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-2.5 h-2 rounded-xs bg-amber-500" />
        <span>Almuerzo / Pre</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-2.5 h-[2px] rounded-xs bg-rose-500" />
        <span>Hora actual (Chile)</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-2.5 h-[2px] rounded-xs bg-sky-400" />
        <span>Cursor interactivo</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-300 text-[9px] font-semibold font-mono border border-rose-500/35">
          <Flame className="w-2 h-2 fill-current" />
          <span>Alto</span>
        </span>
        <span>Impacto Alto</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 text-[9px] font-semibold font-mono border border-amber-500/35">
          <AlertCircle className="w-2 h-2" />
          <span>Medio</span>
        </span>
        <span>Impacto Medio</span>
      </div>
    </div>
  );
});

TimelineLegend.displayName = 'TimelineLegend';
