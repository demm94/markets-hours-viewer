import React from 'react';
import { RotateCcw, Clock } from 'lucide-react';
import { Button } from '../ui/button';
import { MarketHoliday, RollingDayInfo } from '../../core/types';
import { TimelineWeekSelector } from './TimelineWeekSelector';

interface TimelineHeaderProps {
  isToday?: boolean;
  onResetToToday?: () => void;
  days: RollingDayInfo[];
  selectedIsoDate: string;
  onSelectDay: (day: RollingDayInfo) => void;
  chileHoliday?: MarketHoliday;
}

export const TimelineHeader: React.FC<TimelineHeaderProps> = React.memo(({
  isToday = true,
  onResetToToday,
  days,
  selectedIsoDate,
  onSelectDay,
  chileHoliday
}) => {
  return (
    <div className="flex flex-col gap-1.5 sm:gap-2">
      <div className="flex items-center justify-between gap-1.5 sm:gap-2 min-h-[28px] sm:min-h-[32px]">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-sky-500/10 border border-sky-500/25 flex items-center justify-center text-sky-400 shrink-0">
            <Clock size={13} aria-hidden="true" />
          </div>
          <h2 className="text-[13px] sm:text-base font-semibold tracking-tight text-zinc-100 whitespace-nowrap truncate">
            Línea de Tiempo
          </h2>
          <span className="text-[10px] sm:text-[11px] font-mono font-medium text-zinc-300 bg-white/[0.04] px-1.5 sm:px-2 py-0.5 rounded border border-border whitespace-nowrap shrink-0">
            <span aria-hidden="true">🇨🇱</span> Hora Chile
          </span>
        </div>

        {!isToday && onResetToToday && (
          <Button
            variant="outline"
            size="compact"
            onClick={onResetToToday}
            className="h-[26px] sm:h-7 gap-1 px-2 sm:px-2.5 text-[10.5px] sm:text-xs [&_svg]:size-3 font-medium border-sky-500/40 bg-sky-500/12 text-sky-200 hover:bg-sky-500/22 hover:text-white cursor-pointer shrink-0"
            title="Volver al día de hoy"
          >
            <RotateCcw size={12} aria-hidden="true" />
            <span>Volver a Hoy</span>
          </Button>
        )}
      </div>

      {chileHoliday && (
        <div className="flex items-center">
          <span
            className={
              chileHoliday.isEarlyClose
                ? 'text-[10px] sm:text-[11px] font-medium text-amber-200 bg-amber-500/12 px-1.5 sm:px-2 py-0.5 rounded border border-amber-500/35 truncate max-w-full'
                : 'text-[10px] sm:text-[11px] font-medium text-violet-200 bg-violet-500/12 px-1.5 sm:px-2 py-0.5 rounded border border-violet-500/35 truncate max-w-full'
            }
            title={
              chileHoliday.isEarlyClose
                ? `Cierre temprano en Chile${chileHoliday.closeTime ? ` (${chileHoliday.closeTime})` : ''}: ${chileHoliday.name}`
                : `Feriado en Chile: ${chileHoliday.name}`
            }
          >
            <span aria-hidden="true">🇨🇱</span>{' '}
            {chileHoliday.isEarlyClose
              ? `Cierre temprano${chileHoliday.closeTime ? ` (${chileHoliday.closeTime})` : ''}: ${chileHoliday.name}`
              : `Feriado: ${chileHoliday.name}`}
          </span>
        </div>
      )}

      <TimelineWeekSelector
        days={days}
        selectedIsoDate={selectedIsoDate}
        onSelectDay={onSelectDay}
      />
    </div>
  );
});

TimelineHeader.displayName = 'TimelineHeader';
