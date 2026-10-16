import React from 'react';
import { PanelLeftClose, PanelLeftOpen, RotateCcw } from 'lucide-react';
import { Button } from '../ui/button';
import { RollingDayInfo } from '../../core/types';
import { TimelineWeekSelector } from './TimelineWeekSelector';

interface TimelineHeaderProps {
  isColumnCollapsed: boolean;
  onToggleColumn: () => void;
  isScrubbing?: boolean;
  onResetScrubber?: () => void;
  days?: RollingDayInfo[];
  selectedIsoDate?: string;
  onSelectDay?: (day: RollingDayInfo) => void;
}

export const TimelineHeader: React.FC<TimelineHeaderProps> = React.memo(({
  isColumnCollapsed,
  onToggleColumn,
  isScrubbing = false,
  onResetScrubber,
  days,
  selectedIsoDate,
  onSelectDay
}) => {
  return (
    <div className="flex flex-col gap-1.5 sm:gap-2 mb-1 sm:mb-2">
      <div className="flex flex-row justify-between items-center gap-2">
        <h2 className="text-xs sm:text-sm font-semibold tracking-tight text-zinc-100 flex items-center gap-2">
          <span>Línea 24 Horas</span>
          <span className="text-[10px] sm:text-xs font-mono font-medium text-zinc-300 bg-white/[0.04] px-2 py-0.5 rounded border border-border whitespace-nowrap">
            🇨🇱 Chile
          </span>
        </h2>
        <div className="flex items-center gap-1.5 sm:gap-2">
          {isScrubbing && onResetScrubber && (
            <Button
              variant="outline"
              size="sm"
              onClick={onResetScrubber}
              className="gap-1 min-h-[34px] px-2.5 sm:px-3 py-1 text-[10px] sm:text-xs font-medium border-sky-500/35 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20 hover:text-white"
              title="Restablecer cursor a la hora actual"
            >
              <RotateCcw size={12} />
              <span>Volver a Ahora</span>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleColumn}
            className="gap-1 min-h-[34px] px-2.5 sm:px-3 py-1 text-[10px] sm:text-xs font-medium"
            title={isColumnCollapsed ? 'Expandir nombres y detalles de mercados' : 'Colapsar a solo banderas para más espacio'}
          >
            {isColumnCollapsed ? <PanelLeftOpen size={13} /> : <PanelLeftClose size={13} />}
            <span>{isColumnCollapsed ? 'Mercados' : 'Colapsar'}</span>
          </Button>
          <span className="font-mono text-[11px] font-medium text-muted-foreground bg-white/[0.03] px-2.5 py-1 rounded-md border border-border hidden lg:inline">
            Deslizá sobre la cuadrícula para sincronizar horarios
          </span>
        </div>
      </div>

      {days && selectedIsoDate && onSelectDay && (
        <TimelineWeekSelector
          days={days}
          selectedIsoDate={selectedIsoDate}
          onSelectDay={onSelectDay}
        />
      )}
    </div>
  );
});

TimelineHeader.displayName = 'TimelineHeader';
