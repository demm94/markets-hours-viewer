import React from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Button } from '../ui/button';

interface TimelineHeaderProps {
  isColumnCollapsed: boolean;
  onToggleColumn: () => void;
}

export const TimelineHeader: React.FC<TimelineHeaderProps> = React.memo(({
  isColumnCollapsed,
  onToggleColumn
}) => {
  return (
    <div className="flex flex-row justify-between items-center gap-2 mb-1 sm:mb-2.5">
      <h2 className="text-xs sm:text-sm md:text-base font-bold tracking-tight text-white flex items-center gap-1.5 sm:gap-2">
        <span>Línea 24 Horas</span>
        <span className="text-[9px] sm:text-xs font-mono font-medium text-sky-400 bg-sky-400/10 px-1.5 sm:px-2 py-0.5 rounded border border-sky-400/20 whitespace-nowrap">
          🇨🇱 Chile
        </span>
      </h2>
      <div className="flex items-center gap-2 sm:gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleColumn}
          className="gap-1 min-h-[26px] sm:min-h-[32px] px-2 sm:px-3 py-0.5 text-[10px] sm:text-xs font-semibold"
          title={isColumnCollapsed ? 'Expandir nombres y detalles de mercados' : 'Colapsar a solo banderas para más espacio'}
        >
          {isColumnCollapsed ? <PanelLeftOpen size={13} /> : <PanelLeftClose size={13} />}
          <span>{isColumnCollapsed ? 'Mercados' : 'Colapsar'}</span>
        </Button>
        <span className="font-mono text-xs font-semibold text-sky-400 bg-sky-400/10 px-3 py-1 rounded-lg border border-sky-400/25 shadow-[0_0_12px_rgba(56,189,248,0.12)] hidden lg:inline">
          Deslizá sobre la cuadrícula para sincronizar horarios
        </span>
      </div>
    </div>
  );
});

TimelineHeader.displayName = 'TimelineHeader';
