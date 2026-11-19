import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { CalendarOff, Eye, RotateCcw } from 'lucide-react';
import { MarketConfig, MarketEvaluation, TimelineSegment, TimelineEventMarkerData, RollingDayInfo } from '../core/types';
import { CHILE_CONFIG } from '../core/markets';
import { TimelineHeader } from './timeline/TimelineHeader';
import { TimelineLeftColumn } from './timeline/TimelineLeftColumn';
import { TimelineBars } from './timeline/TimelineBars';
import { TimelineLegend } from './timeline/TimelineLegend';
import { Button } from './ui/button';

const CHILE_MARKET: MarketConfig = {
  ...CHILE_CONFIG,
  sessions: []
};

interface TimelineGridProps {
  markets: MarketConfig[];
  marketSegments: Record<string, TimelineSegment[]>;
  scrubberEvaluations: Record<string, MarketEvaluation>;
  chileScrubberEvaluation: MarketEvaluation;
  scrubberMinutes: number;
  currentMinutes: number;
  isHovering: boolean;
  isPinned?: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
  dailyEvents?: Record<string, TimelineEventMarkerData[]>;
  onEventClick?: (event: TimelineEventMarkerData) => void;
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerCancel?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerLeave: (e: React.PointerEvent<HTMLDivElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  onResetScrubber?: () => void;
  rollingDays: RollingDayInfo[];
  selectedIsoDate: string;
  onSelectDay: (day: RollingDayInfo) => void;
  isToday?: boolean;
  isWeekendDay?: boolean;
  simulateWeekday?: boolean;
  onToggleSimulateWeekday?: () => void;
  nextReopenLabel?: string;
}

export const TimelineGrid: React.FC<TimelineGridProps> = React.memo(({
  markets,
  marketSegments,
  scrubberEvaluations,
  chileScrubberEvaluation,
  scrubberMinutes,
  currentMinutes,
  isHovering,
  isPinned = false,
  containerRef,
  dailyEvents,
  onEventClick,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onPointerLeave,
  onKeyDown,
  onResetScrubber,
  rollingDays,
  selectedIsoDate,
  onSelectDay,
  isToday = true,
  isWeekendDay = false,
  simulateWeekday = false,
  onToggleSimulateWeekday,
  nextReopenLabel
}) => {
  const userToggledRef = useRef(false);

  // Default to collapsed on mobile viewports (<= 768px) to maximize 24h bar space
  const [isColumnCollapsed, setIsColumnCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth <= 768;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mql = window.matchMedia('(max-width: 768px)');
    const handleMediaChange = (e: MediaQueryListEvent) => {
      if (!userToggledRef.current) {
        setIsColumnCollapsed(e.matches);
      }
    };
    mql.addEventListener('change', handleMediaChange);
    return () => mql.removeEventListener('change', handleMediaChange);
  }, []);

  const toggleColumn = useCallback(() => {
    userToggledRef.current = true;
    setIsColumnCollapsed((prev) => !prev);
  }, []);

  const allMarkets = useMemo(() => [CHILE_MARKET, ...markets], [markets]);

  const hasAnyRealSegment = useMemo(
    () => markets.some((m) => (marketSegments[m.id]?.length ?? 0) > 0),
    [markets, marketSegments]
  );

  return (
    <section
      aria-label="Línea de tiempo bursátil de 24 horas"
      className="rounded-xl border border-border bg-card backdrop-blur-md shadow-neon p-3 sm:p-4 md:p-5 flex flex-col gap-3"
    >
      <TimelineHeader
        isColumnCollapsed={isColumnCollapsed}
        onToggleColumn={toggleColumn}
        isScrubbing={isHovering}
        isPinned={isPinned}
        onResetScrubber={onResetScrubber}
        days={rollingDays}
        selectedIsoDate={selectedIsoDate}
        onSelectDay={onSelectDay}
      />

      {/* Honest Weekend Banner with explicit Weekday Reference Simulation Toggle */}
      {isWeekendDay && onToggleSimulateWeekday && (
        <div
          className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-3 py-2 rounded-lg border text-xs ${
            simulateWeekday
              ? 'border-sky-500/35 bg-sky-500/10 text-sky-100'
              : 'border-border-strong bg-white/[0.03] text-zinc-200'
          }`}
        >
          <div className="flex items-start sm:items-center gap-2 min-w-0">
            <CalendarOff
              size={15}
              className={`shrink-0 mt-0.5 sm:mt-0 ${simulateWeekday ? 'text-sky-400' : 'text-zinc-400'}`}
              aria-hidden="true"
            />
            <span className="leading-snug">
              {simulateWeekday ? (
                <>
                  <strong>Jornada hábil de referencia:</strong> mostrando horarios habituales de lunes a viernes en hora Chile.
                </>
              ) : hasAnyRealSegment ? (
                <>
                  <strong>Fin de semana:</strong> mercados occidentales cerrados; solo aperturas asiáticas desde la noche (hora Chile).
                </>
              ) : (
                <>
                  <strong>Fin de semana:</strong> mercados cerrados hoy.
                  {nextReopenLabel && (
                    <span className="text-zinc-400"> Próxima apertura: {nextReopenLabel}.</span>
                  )}
                </>
              )}
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onToggleSimulateWeekday}
            className="gap-1.5 min-h-[34px] px-3 text-xs font-medium shrink-0 self-start sm:self-auto cursor-pointer"
          >
            {simulateWeekday ? (
              <>
                <RotateCcw size={12} aria-hidden="true" />
                <span>Volver a calendario real</span>
              </>
            ) : (
              <>
                <Eye size={13} aria-hidden="true" />
                <span>Ver jornada hábil de referencia</span>
              </>
            )}
          </Button>
        </div>
      )}

      {/* Horizontal Table with Left Sticky Column + 24h Bars */}
      <div className="timeline-table-wrapper relative flex w-full overflow-x-auto select-none rounded-xl border border-border bg-muted/40 touch-pan-y [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <TimelineLeftColumn
          allMarkets={allMarkets}
          isColumnCollapsed={isColumnCollapsed}
          scrubberEvaluations={scrubberEvaluations}
          chileScrubberEvaluation={chileScrubberEvaluation}
        />

        <TimelineBars
          allMarkets={allMarkets}
          marketSegments={marketSegments}
          scrubberEvaluations={scrubberEvaluations}
          chileScrubberEvaluation={chileScrubberEvaluation}
          scrubberMinutes={scrubberMinutes}
          currentMinutes={currentMinutes}
          isHovering={isHovering}
          isPinned={isPinned}
          isColumnCollapsed={isColumnCollapsed}
          containerRef={containerRef}
          dailyEvents={dailyEvents}
          onEventClick={onEventClick}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          onPointerLeave={onPointerLeave}
          onKeyDown={onKeyDown}
          isToday={isToday}
          isWeekendDay={isWeekendDay}
          simulateWeekday={simulateWeekday}
        />
      </div>

      <TimelineLegend />
    </section>
  );
});

TimelineGrid.displayName = 'TimelineGrid';
