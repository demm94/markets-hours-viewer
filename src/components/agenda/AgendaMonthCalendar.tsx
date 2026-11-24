import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MonthCalendarDayCell, MonthCalendarGrid } from '../../core/types';
import { cn } from '../../lib/utils';

export interface AgendaMonthCalendarProps {
  grid: MonthCalendarGrid;
  focusedIsoDate: string | null;
  isCurrentMonth: boolean;
  onSelectDate: (isoDate: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onJumpToCurrentMonth: () => void;
}

const WEEKDAY_HEADERS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

function buildCellAriaLabel(cell: MonthCalendarDayCell): string {
  const parts = [cell.isoDate];
  if (cell.isToday) parts.push('Hoy');
  if (cell.holidayCount > 0) {
    parts.push(`${cell.holidayCount} feriado${cell.holidayCount > 1 ? 's' : ''}`);
  }
  if (cell.earlyCloseCount > 0) {
    parts.push(`${cell.earlyCloseCount} cierre${cell.earlyCloseCount > 1 ? 's' : ''} temprano${cell.earlyCloseCount > 1 ? 's' : ''}`);
  }
  const eventTotal = cell.highImpactCount + cell.mediumImpactCount;
  if (eventTotal > 0) {
    parts.push(
      `${eventTotal} evento${eventTotal > 1 ? 's' : ''}${
        cell.highImpactCount > 0 ? ` (${cell.highImpactCount} de impacto alto)` : ''
      }`
    );
  }
  if (cell.totalCount === 0) {
    parts.push('Sin actividad');
  }
  return parts.join(', ');
}

export const AgendaMonthCalendar: React.FC<AgendaMonthCalendarProps> = React.memo(({
  grid,
  focusedIsoDate,
  isCurrentMonth,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  onJumpToCurrentMonth
}) => {
  return (
    <div
      className="rounded-xl border border-border bg-card/80 p-2.5 sm:p-3 flex flex-col gap-2"
      aria-label={`Calendario de ${grid.monthLabel}`}
    >
      {/* Month navigation header */}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onPrevMonth}
          aria-label="Mes anterior"
          className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-border bg-white/[0.03] hover:bg-white/[0.08] text-zinc-300 hover:text-white transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
        >
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs sm:text-sm font-semibold text-zinc-100 tracking-tight truncate">
            {grid.monthLabel}
          </span>
          {!isCurrentMonth && (
            <button
              type="button"
              onClick={onJumpToCurrentMonth}
              className="px-2 py-0.5 rounded-md border border-emerald-500/35 bg-emerald-500/12 hover:bg-emerald-500/20 text-[11px] font-medium text-emerald-300 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              Hoy
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onNextMonth}
          aria-label="Mes siguiente"
          className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-border bg-white/[0.03] hover:bg-white/[0.08] text-zinc-300 hover:text-white transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
        >
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 text-center" aria-hidden="true">
        {WEEKDAY_HEADERS.map((label) => (
          <span
            key={label}
            className="text-[10px] font-mono font-semibold text-muted-foreground uppercase py-0.5"
          >
            {label}
          </span>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1 w-full">
        {grid.cells.map((cell) => {
          const isFocused = focusedIsoDate === cell.isoDate;
          const hasHolidayDot = cell.holidayCount > 0;
          const hasHighDot = cell.highImpactCount > 0;
          const hasAmberDot = cell.earlyCloseCount > 0 || cell.mediumImpactCount > 0;

          return (
            <button
              key={cell.isoDate}
              type="button"
              onClick={() => onSelectDate(cell.isoDate)}
              aria-pressed={isFocused}
              aria-label={buildCellAriaLabel(cell)}
              className={cn(
                'flex flex-col items-center justify-center gap-1 min-h-[36px] rounded-lg border text-xs font-mono tabular-nums transition-colors duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400',
                !cell.isCurrentMonth && 'opacity-35',
                isFocused
                  ? 'border-sky-400/70 bg-sky-500/20 text-white font-semibold'
                  : cell.isToday
                  ? 'border-emerald-500/40 bg-emerald-500/12 text-emerald-200 font-semibold hover:bg-emerald-500/20'
                  : cell.isCurrentMonth && cell.isPast && cell.totalCount === 0
                  ? 'border-transparent bg-white/[0.015] text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300'
                  : 'border-border/60 bg-white/[0.02] text-zinc-200 hover:bg-white/[0.06] hover:border-border-strong'
              )}
            >
              <span className="leading-none">{cell.dayOfMonth}</span>

              <span className="h-1.5 flex items-center justify-center gap-0.5" aria-hidden="true">
                {hasHolidayDot && (
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                )}
                {hasHighDot && (
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                )}
                {hasAmberDot && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* Compact legend */}
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 pt-1 border-t border-border/60 text-[10px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400" aria-hidden="true" />
          <span>Feriado</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" aria-hidden="true" />
          <span>Alto</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" aria-hidden="true" />
          <span>Medio / temprano</span>
        </span>
      </div>
    </div>
  );
});

AgendaMonthCalendar.displayName = 'AgendaMonthCalendar';
