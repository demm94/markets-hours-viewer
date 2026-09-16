import React from 'react';

export const TimelineLegend: React.FC = React.memo(() => {
  return (
    <div className="flex flex-wrap items-center justify-start md:justify-center gap-x-6 gap-y-2 border-t border-white/10 pt-3 pb-0.5 text-xs font-medium text-slate-300 mt-1">
      <div className="flex items-center gap-2">
        <span className="w-3.5 h-2.5 rounded-sm bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
        <span>Mercado Abierto</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-3.5 h-2.5 rounded-sm bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
        <span>Almuerzo / Pre-apertura</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-3.5 h-2.5 rounded-sm bg-[#151d2f] border border-slate-600" />
        <span>Cerrado</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-3.5 h-[2.5px] rounded-[1px] bg-rose-600 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
        <span>Hora actual (Chile)</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-3.5 h-[2.5px] rounded-[1px] bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.6)]" />
        <span>Cursor interactivo</span>
      </div>
    </div>
  );
});

TimelineLegend.displayName = 'TimelineLegend';
