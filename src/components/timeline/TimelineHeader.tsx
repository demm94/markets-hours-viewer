import React from 'react';
import { PanelLeftClose, PanelLeftOpen, RotateCcw, Clock } from 'lucide-react';
import { Button } from '../ui/button';
import { RollingDayInfo } from '../../core/types';
import { TimelineWeekSelector } from './TimelineWeekSelector';

interface TimelineHeaderProps {
  isColumnCollapsed: boolean;
  onToggleColumn: () => void;
  isPinned?: boolean;
  isToday?: boolean;
  onResetScrubber?: () => void;
  days: RollingDayInfo[];
  selectedIsoDate: string;
  onSelectDay: (day: RollingDayInfo) => void;
}

export const TimelineHeader: React.FC<TimelineHeaderProps> = React.memo(({
  isColumnCollapsed,
  onToggleColumn,
  isPinned = false,
  isToday = true,
  onResetScrubber,
  days,
  selectedIsoDate,
  onSelectDay
}) => {
  const showReset = Boolean((isPinned || !isToday) && onResetScrubber);
  const collapseLabel = isColumnCollapsed
    ? 'Expandir nombres y horarios locales de cada mercado'
    : 'Colapsar columna a solo banderas';

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/25 flex items-center justify-center text-sky-400 shrink-0">
            <Clock size={14} aria-hidden="true" />
          </div>
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <h2 className="text-sm sm:text-base font-semibold tracking-tight text-zinc-100">
              Línea 24 Horas
            </h2>
            <span className="text-[11px] font-mono font-medium text-zinc-300 bg-white/[0.04] px-2 py-0.5 rounded border border-border whitespace-nowrap">
              <span aria-hidden="true">🇨🇱</span> Hora Chile
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {showReset && onResetScrubber && (
            <Button
              variant="outline"
              size="sm"
              onClick={onResetScrubber}
              className="gap-1.5 min-h-[40px] px-2.5 sm:px-3 py-1 text-xs font-medium border-sky-500/40 bg-sky-500/12 text-sky-200 hover:bg-sky-500/22 hover:text-white cursor-pointer"
              title="Restablecer cursor al día y hora actual"
            >
              <RotateCcw size={12} aria-hidden="true" />
              <span>Volver a Ahora</span>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleColumn}
            className="gap-1.5 min-h-[40px] px-2.5 sm:px-3 py-1 text-xs font-medium cursor-pointer"
            title={collapseLabel}
            aria-label={collapseLabel}
            aria-expanded={!isColumnCollapsed}
          >
            {isColumnCollapsed ? <PanelLeftOpen size={13} aria-hidden="true" /> : <PanelLeftClose size={13} aria-hidden="true" />}
            <span>{isColumnCollapsed ? 'Mercados' : 'Colapsar'}</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-2">
        <div className="flex-1 min-w-0">
          <TimelineWeekSelector
            days={days}
            selectedIsoDate={selectedIsoDate}
            onSelectDay={onSelectDay}
          />
        </div>

        <p className="font-mono text-[11px] text-muted-foreground sm:whitespace-nowrap shrink-0">
          <span className="hidden sm:inline">
            {isPinned
              ? 'Hora fijada · Haz clic en otra hora o vuelve a Ahora'
              : 'Pasa el cursor para explorar · Haz clic para fijar una hora'}
          </span>
          <span className="sm:hidden">
            {isPinned
              ? 'Hora fijada · Toca otra hora o vuelve a Ahora'
              : 'Toca o arrastra para comparar horarios'}
          </span>
        </p>
      </div>
    </div>
  );
});

TimelineHeader.displayName = 'TimelineHeader';
