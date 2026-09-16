import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { MarketConfig, MarketEvaluation, TimelineSegment } from '../core/types';
import { CHILE_CONFIG } from '../core/markets';
import { TimelineHeader } from './timeline/TimelineHeader';
import { TimelineLeftColumn } from './timeline/TimelineLeftColumn';
import { TimelineBars } from './timeline/TimelineBars';
import { TimelineSlider } from './timeline/TimelineSlider';
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
  scrubberMinutes: number;
  currentMinutes: number;
  isHovering: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
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
  scrubberMinutes,
  currentMinutes,
  isHovering,
  containerRef,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onPointerLeave,
  onKeyDown
}) => {
  const tableWrapperRef = useRef<HTMLDivElement | null>(null);
  const [scrollRatio, setScrollRatio] = useState<number>(0);

  const nowPercent = (currentMinutes / 1440) * 100;

  // Default to collapsed on mobile viewports (<= 768px) to maximize timeline space
  const [isColumnCollapsed, setIsColumnCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth <= 768;
    }
    return false;
  });

  const toggleColumn = useCallback(() => setIsColumnCollapsed((prev) => !prev), []);

  // Synchronize range slider when user scrolls table natively
  const handleTableScroll = useCallback(() => {
    if (!tableWrapperRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = tableWrapperRef.current;
    const maxScroll = scrollWidth - clientWidth;
    if (maxScroll > 0) {
      setScrollRatio(scrollLeft / maxScroll);
    }
  }, []);

  // Synchronize table position when user drags slider
  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newRatio = parseFloat(e.target.value);
    setScrollRatio(newRatio);
    if (tableWrapperRef.current) {
      const { scrollWidth, clientWidth } = tableWrapperRef.current;
      const maxScroll = scrollWidth - clientWidth;
      tableWrapperRef.current.scrollLeft = newRatio * maxScroll;
    }
  }, []);

  // Center timeline viewport on the red "AHORA" indicator line
  const scrollToNow = useCallback(() => {
    if (!tableWrapperRef.current) return;
    const { scrollWidth, clientWidth } = tableWrapperRef.current;
    const maxScroll = scrollWidth - clientWidth;
    if (maxScroll <= 0) return;

    const leftCol = tableWrapperRef.current.querySelector('.timeline-left-column') as HTMLElement | null;
    const leftWidth = leftCol?.offsetWidth ?? (isColumnCollapsed ? 56 : 270);
    const barsWidth = scrollWidth - leftWidth;
    const nowPx = leftWidth + (nowPercent / 100) * barsWidth;

    const target = Math.max(0, Math.min(maxScroll, nowPx - clientWidth / 2));
    tableWrapperRef.current.scrollTo({
      left: target,
      behavior: 'smooth'
    });
  }, [nowPercent, isColumnCollapsed]);

  const scrollToNowRef = useRef(scrollToNow);
  scrollToNowRef.current = scrollToNow;

  const hasInitialCenteredRef = useRef<boolean>(false);

  // Initial center on current time (once) and window resize listener
  useEffect(() => {
    const handleResize = () => {
      handleTableScroll();
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    let timer: ReturnType<typeof setTimeout> | undefined;
    if (!hasInitialCenteredRef.current) {
      hasInitialCenteredRef.current = true;
      timer = setTimeout(() => {
        scrollToNowRef.current();
      }, 150);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (timer) clearTimeout(timer);
    };
  }, [handleTableScroll]);

  const allMarkets = useMemo(() => [CHILE_MARKET, ...markets], [markets]);

  return (
    <section className="rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900/80 via-slate-900/60 to-slate-950/90 backdrop-blur-2xl p-3.5 sm:p-4 md:p-5 shadow-xl flex flex-col gap-3.5 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-sky-400/30 to-transparent pointer-events-none" />

      {/* Top Controls Row */}
      <TimelineHeader
        isColumnCollapsed={isColumnCollapsed}
        onToggleColumn={toggleColumn}
      />

      {/* Horizontal Scrollable Table with Left Frozen Column + 24h Bars */}
      <div 
        className="timeline-table-wrapper relative flex overflow-x-auto select-none rounded-2xl border border-white/10 bg-[#060911]/95 shadow-[inset_0_2px_14px_rgba(0,0,0,0.6)] touch-pan-y [scrollbar-width:thin] [scrollbar-color:rgba(56,189,248,0.35)_rgba(15,23,42,0.85)] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-slate-900/85 [&::-webkit-scrollbar-thumb]:bg-sky-400/35 hover:[&::-webkit-scrollbar-thumb]:bg-sky-400/60 [&::-webkit-scrollbar-thumb]:rounded"
        ref={tableWrapperRef}
        onScroll={handleTableScroll}
      >
        <TimelineLeftColumn
          allMarkets={allMarkets}
          isColumnCollapsed={isColumnCollapsed}
          onToggleColumn={toggleColumn}
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
          isColumnCollapsed={isColumnCollapsed}
          containerRef={containerRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          onPointerLeave={onPointerLeave}
          onKeyDown={onKeyDown}
        />
      </div>

      {/* Horizontal Viewport Navigator Slider */}
      <TimelineSlider
        scrollRatio={scrollRatio}
        onSliderChange={handleSliderChange}
        onScrollToNow={scrollToNow}
      />

      {/* Legend */}
      <TimelineLegend />
    </section>
  );
});

TimelineGrid.displayName = 'TimelineGrid';
