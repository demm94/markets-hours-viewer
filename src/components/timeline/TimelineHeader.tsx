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
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
      <h2 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
        <span>Línea de Tiempo 24 Horas (Hora de Chile)</span>
      </h2>
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleColumn}
          className="gap-1.5 min-h-[34px] px-3 text-xs font-semibold"
          title={isColumnCollapsed ? 'Expandir nombres y detalles de mercados' : 'Colapsar a solo banderas para más espacio'}
        >
          {isColumnCollapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
          <span>{isColumnCollapsed ? 'Ver mercados' : 'Colapsar mercados'}</span>
        </Button>
        <span className="font-mono text-xs font-semibold text-sky-400 bg-sky-400/10 px-3 py-1 rounded-lg border border-sky-400/25 shadow-[0_0_12px_rgba(56,189,248,0.12)] hidden md:inline">
          Pasa el cursor o desliza sobre la cuadrícula para sincronizar horarios
        </span>
      </div>
    </div>
  );
});

TimelineHeader.displayName = 'TimelineHeader';
