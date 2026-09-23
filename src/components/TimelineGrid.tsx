import React, { useState, useCallback, useMemo } from 'react';
import { MarketConfig, MarketEvaluation, TimelineSegment, TimelineEventMarkerData } from '../core/types';
import { CHILE_CONFIG } from '../core/markets';
import { TimelineHeader } from './timeline/TimelineHeader';
import { TimelineLeftColumn } from './timeline/TimelineLeftColumn';
import { TimelineBars } from './timeline/TimelineBars';
import { TimelineLegend } from './timeline/TimelineLegend';

const CHILE_MARKET: MarketConfig = {
  ...CHILE_CONFIG,
  sessions: []
};

interface TimelineGridProps {
  markets: MarketConfig[];
  marketSegments: Record<string, TimelineSegment[]>;
  scrubberEvaluations: Record<string, MarketEvaluation>;
  chileScrubberEvaluation: MarketEvaluation;
  evaluationsNow?: Record<string, MarketEvaluation>;
  scrubberMinutes: number;
  currentMinutes: number;
  isHovering: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
  dailyEvents?: Record<string, TimelineEventMarkerData[]>;
  onSelectEvent?: (marketId: string) => void;
  onEventClick?: (event: TimelineEventMarkerData) => void;
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerCancel?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerLeave: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
}

export const TimelineGrid: React.FC<TimelineGridProps> = React.memo(({
  markets,
  marketSegments,
  scrubberEvaluations,
  chileScrubberEvaluation,
  evaluationsNow,
  scrubberMinutes,
  currentMinutes,
  isHovering,
  containerRef,
  dailyEvents,
  onSelectEvent,
  onEventClick,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onPointerLeave,
  onKeyDown
}) => {
  // Default to collapsed on mobile viewports (<= 768px) to maximize timeline space
  const [isColumnCollapsed, setIsColumnCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth <= 768;
    }
    return false;
  });

  const toggleColumn = useCallback(() => setIsColumnCollapsed((prev) => !prev), []);

  const allMarkets = useMemo(() => [CHILE_MARKET, ...markets], [markets]);

  return (
    <section className="rounded-2xl border border-border bg-card backdrop-blur-2xl p-2 sm:p-3.5 md:p-5 shadow-neon flex flex-col gap-2 sm:gap-3.5 relative overflow-hidden neon-edge">
      {/* Top Controls Row */}
      <TimelineHeader
        isColumnCollapsed={isColumnCollapsed}
        onToggleColumn={toggleColumn}
      />

      {/* Horizontal Table with Left Frozen Column + 24h Bars */}
      <div 
        className="timeline-table-wrapper relative flex w-full overflow-x-auto select-none rounded-2xl border border-border bg-muted shadow-[inset_0_2px_14px_rgba(0,0,0,0.6)] touch-pan-y [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <TimelineLeftColumn
          allMarkets={allMarkets}
          isColumnCollapsed={isColumnCollapsed}
          onToggleColumn={toggleColumn}
          scrubberEvaluations={scrubberEvaluations}
          chileScrubberEvaluation={chileScrubberEvaluation}
          evaluationsNow={evaluationsNow}
        />

        <TimelineBars
          allMarkets={allMarkets}
          marketSegments={marketSegments}
          scrubberEvaluations={scrubberEvaluations}
          chileScrubberEvaluation={chileScrubberEvaluation}
          evaluationsNow={evaluationsNow}
          scrubberMinutes={scrubberMinutes}
          currentMinutes={currentMinutes}
          isHovering={isHovering}
          isColumnCollapsed={isColumnCollapsed}
          containerRef={containerRef}
          dailyEvents={dailyEvents}
          onSelectEvent={onSelectEvent}
          onEventClick={onEventClick}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          onPointerLeave={onPointerLeave}
          onKeyDown={onKeyDown}
        />
      </div>

      {/* Legend */}
      <TimelineLegend />
    </section>
  );
});

TimelineGrid.displayName = 'TimelineGrid';
