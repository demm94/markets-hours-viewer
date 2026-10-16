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
    <div className="flex flex-col gap-1.5 sm:gap-2 mb-1 sm:mb-2.5">
      <div className="flex flex-row justify-between items-center gap-2">
        <h2 className="text-xs sm:text-sm md:text-base font-bold tracking-tight text-white flex items-center gap-1.5 sm:gap-2">
          <span>Línea 24 Horas</span>
          <span className="text-[9px] sm:text-xs font-mono font-medium text-sky-400 bg-sky-400/10 px-1.5 sm:px-2 py-0.5 rounded border border-sky-400/20 whitespace-nowrap">
            🇨🇱 Chile
          </span>
        </h2>
        <div className="flex items-center gap-1.5 sm:gap-3">
          {isScrubbing && onResetScrubber && (
            <Button
              variant="outline"
              size="sm"
              onClick={onResetScrubber}
              className="gap-1 min-h-[36px] px-2.5 sm:px-3 py-1 text-[10px] sm:text-xs font-semibold border-sky-400/40 bg-sky-500/15 text-sky-300 hover:bg-sky-500/25 hover:text-white"
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
            className="gap-1 min-h-[36px] px-2.5 sm:px-3 py-1 text-[10px] sm:text-xs font-semibold"
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
