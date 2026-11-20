import React from 'react';
import { MarketConfig, TimelineSegment, TimelineEventMarkerData } from '../../core/types';
import { formatMinutes } from '../../core/timezone';
import {
  canShowInlineBarLabel,
  clampTimelineMinuteFromPointer,
  formatSegmentBarLabel,
  getSegmentTooltip
} from '../../core/timeline-schedule';
import { TimelineEventMarker } from './TimelineEventMarker';

const HOURS = [0, 3, 6, 9, 12, 15, 18, 21, 24];
const GRID_LINES = Array.from({ length: 25 }, (_, i) => i);

export interface TimelineSegmentRef {
  marketId: string;
  segmentIndex: number;
}

interface TimelineBarsProps {
  markets: MarketConfig[];
  marketSegments: Record<string, TimelineSegment[]>;
  currentMinutes: number;
  dailyEvents?: Record<string, TimelineEventMarkerData[]>;
  onEventClick?: (event: TimelineEventMarkerData) => void;
  isToday?: boolean;
  isWeekendDay?: boolean;
  simulateWeekday?: boolean;
  hoverMinute: number | null;
  hoveredSegment: TimelineSegmentRef | null;
  pinnedSegment: TimelineSegmentRef | null;
  onHoverMinuteChange: (minute: number | null) => void;
  onHoveredSegmentChange: (seg: TimelineSegmentRef | null) => void;
  onTogglePinnedSegment: (seg: TimelineSegmentRef | null) => void;
}

export const TimelineBars: React.FC<TimelineBarsProps> = React.memo(({
  markets,
  marketSegments,
  currentMinutes,
  dailyEvents = {},
  onEventClick,
  isToday = true,
  isWeekendDay = false,
  simulateWeekday = false,
  hoverMinute,
  hoveredSegment,
  pinnedSegment,
  onHoverMinuteChange,
  onHoveredSegmentChange,
  onTogglePinnedSegment
}) => {
  const [hoveredEventId, setHoveredEventId] = React.useState<string | null>(null);
  const barsRef = React.useRef<HTMLDivElement | null>(null);
  const pointerDownRef = React.useRef<{
    x: number;
    y: number;
    isSliding: boolean;
    pointerType: string;
  } | null>(null);
  const justSlidRef = React.useRef(false);

  const nowPercent = (currentMinutes / 1440) * 100;
  const hoverPercent = hoverMinute !== null ? (hoverMinute / 1440) * 100 : null;
  const showNowLine = isToday;
  const showLiveHighlight = isToday && !simulateWeekday;
  const focusedSegment = hoveredSegment ?? pinnedSegment;

  const resolveMinuteFromClientX = React.useCallback((clientX: number): number | null => {
    const rect = barsRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return clampTimelineMinuteFromPointer(clientX, rect.left, rect.width);
  }, []);

  const handlePointerDown = React.useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') {
      pointerDownRef.current = {
        x: e.clientX,
        y: e.clientY,
        isSliding: false,
        pointerType: e.pointerType
      };
      justSlidRef.current = false;
    }
  }, []);

  const handlePointerMove = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.pointerType === 'mouse') {
        const min = resolveMinuteFromClientX(e.clientX);
        if (min !== null) {
          onHoverMinuteChange(min);
        }
        return;
      }

      const down = pointerDownRef.current;
      if (!down) return;

      const dx = e.clientX - down.x;
      const dy = e.clientY - down.y;

      if (!down.isSliding) {
        if (Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(dy)) {
          down.isSliding = true;
          justSlidRef.current = true;
          onHoveredSegmentChange(null);
          try {
            e.currentTarget.setPointerCapture(e.pointerId);
          } catch {
            // Safe fallback when pointer capture is unavailable
          }
        } else {
          return;
        }
      }

      const min = resolveMinuteFromClientX(e.clientX);
      if (min !== null) {
        onHoverMinuteChange(min);
      }
    },
    [resolveMinuteFromClientX, onHoverMinuteChange, onHoveredSegmentChange]
  );

  const handleTouchRelease = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.pointerType === 'mouse') return;

      if (pointerDownRef.current?.isSliding) {
        onHoverMinuteChange(null);
        setTimeout(() => {
          justSlidRef.current = false;
        }, 60);
      } else {
        justSlidRef.current = false;
      }
      pointerDownRef.current = null;

      try {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      } catch {
        // Safe fallback
      }
    },
    [onHoverMinuteChange]
  );

  const handlePointerLeave = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.pointerType === 'mouse') {
        onHoverMinuteChange(null);
        onHoveredSegmentChange(null);
      }
    },
    [onHoverMinuteChange, onHoveredSegmentChange]
  );

  const handleContainerClick = React.useCallback(() => {
    if (justSlidRef.current) return;
    if (pinnedSegment) {
      onTogglePinnedSegment(null);
    }
  }, [pinnedSegment, onTogglePinnedSegment]);

  const hoverTimeLabel =
    hoverMinute !== null ? (hoverMinute === 1440 ? '24:00' : formatMinutes(hoverMinute)) : '';

  return (
    <div
      ref={barsRef}
      className="timeline-bars-container flex-1 w-full min-w-0 relative flex flex-col select-none touch-pan-y"
      role="region"
      aria-label="Grilla horaria de 24 horas en hora de Chile"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handleTouchRelease}
      onPointerCancel={handleTouchRelease}
      onPointerLeave={handlePointerLeave}
      onClick={handleContainerClick}
    >
      {/* Hour Labels */}
      <div className="h-7 sm:h-10 relative border-b border-border bg-muted rounded-tr-xl">
        {HOURS.map((h) => {
          const tickPct = (h / 24) * 100;
          const nearNow = showNowLine && Math.abs(tickPct - nowPercent) < 13;
          const nearHover = hoverPercent !== null && Math.abs(tickPct - hoverPercent) < 13;
          const isTickHidden = nearNow || nearHover;

          const transform =
            h === 0
              ? 'translate(4px, -50%)'
              : h === 24
              ? 'translate(calc(-100% - 4px), -50%)'
              : 'translate(-50%, -50%)';

          return (
            <div
              key={h}
              aria-hidden={isTickHidden || undefined}
              className={`absolute top-1/2 font-mono text-[9.5px] sm:text-xs font-semibold text-muted-foreground tabular-nums select-none transition-opacity duration-150 ${
                h % 6 !== 0 ? 'hidden sm:block' : ''
              } ${isTickHidden ? 'opacity-0' : 'opacity-100'}`}
              style={{ left: `${tickPct}%`, transform }}
            >
              <span className="hidden sm:inline">{h.toString().padStart(2, '0')}:00</span>
              <span className="sm:hidden">{h.toString().padStart(2, '0')}h</span>
            </div>
          );
        })}
      </div>

      {/* Background Vertical Grid Lines */}
      <div className="absolute top-7 sm:top-10 bottom-0 left-0 right-0 pointer-events-none z-[1]">
        {GRID_LINES.map((h) => (
          <div
            key={h}
            className={`absolute top-0 bottom-0 w-[1px] ${h % 3 === 0 ? 'bg-white/[0.06]' : 'bg-white/[0.02]'}`}
            style={{ left: `${(h / 24) * 100}%` }}
          />
        ))}
      </div>

      {/* Market Bar Rows */}
      <div className="relative flex flex-col">
        {markets.map((market, marketIdx) => {
          const segments = marketSegments[market.id] ?? [];
          const marketEvents = dailyEvents[market.id] ?? [];
          const isRowElevated =
            marketEvents.some((e) => e.id === hoveredEventId) ||
            focusedSegment?.marketId === market.id;
          const isAllDayHoliday =
            segments.length > 0 &&
            segments.every((s) => Boolean(s.holiday && !s.holiday.isEarlyClose));
          const rowHoliday = isAllDayHoliday ? segments[0]?.holiday : undefined;
          const isEmptyWeekendTrack = segments.length === 0 && isWeekendDay && !simulateWeekday;

          return (
            <div
              key={market.id}
              className={`relative h-[36px] sm:h-[46px] md:h-[50px] px-0 flex items-center border-b border-border last:border-b-0 transition-colors hover:bg-white/[0.015] ${
                isRowElevated ? 'z-40' : ''
              } ${isAllDayHoliday ? 'opacity-80 hover:opacity-95 transition-opacity' : ''}`}
            >
              <div
                className={`relative w-full h-[20px] sm:h-[26px] md:h-[28px] border-y rounded-none transition-colors ${
                  isAllDayHoliday
                    ? 'border-violet-500/25 bg-violet-950/15'
                    : 'border-border bg-card/70'
                }`}
              >
                {/* Interactive Session Blocks Layer */}
                <div className="absolute inset-0 overflow-visible z-[2]">
                  {isEmptyWeekendTrack && (
                    <div className="w-full h-full flex items-center justify-center pointer-events-none">
                      <span className="font-mono text-[9.5px] sm:text-[10px] text-zinc-400">
                        Cerrado · Fin de semana
                      </span>
                    </div>
                  )}

                  {isAllDayHoliday && (
                    <div className="absolute inset-0 flex items-center justify-center bg-violet-950/40 z-[3] pointer-events-none">
                      <span className="font-mono text-[9.5px] sm:text-[10px] font-medium text-violet-200 tracking-wider px-2 py-0.5 rounded bg-violet-950/80 border border-violet-500/30 truncate max-w-[160px] sm:max-w-none">
                        Feriado: {rowHoliday?.name}
                      </span>
                    </div>
                  )}

                  {segments.map((seg, idx) => {
                    const leftPercent = (seg.startMinute / 1440) * 100;
                    const widthPercent = ((seg.endMinute - seg.startMinute) / 1440) * 100;
                    const segHoliday = seg.holiday;
                    const isSegFullHoliday = Boolean(segHoliday && !segHoliday.isEarlyClose);
                    const isActive =
                      !isSegFullHoliday &&
                      showLiveHighlight &&
                      currentMinutes >= seg.startMinute &&
                      currentMinutes < seg.endMinute;
                    const isUpcoming =
                      !isSegFullHoliday && (!showLiveHighlight || currentMinutes < seg.startMinute);

                    const isDirectlyFocused = Boolean(
                      focusedSegment &&
                        focusedSegment.marketId === market.id &&
                        focusedSegment.segmentIndex === idx
                    );
                    const isCrossedByHover =
                      !isSegFullHoliday &&
                      hoverMinute !== null &&
                      (hoverMinute === 1440
                        ? seg.endMinute === 1440
                        : hoverMinute >= seg.startMinute && hoverMinute < seg.endMinute);
                    const isDimmed = Boolean(
                      focusedSegment && focusedSegment.marketId !== market.id
                    );

                    let blockClasses = '';
                    if (isSegFullHoliday) {
                      blockClasses = isAllDayHoliday
                        ? 'bg-zinc-800/40 border border-white/5 opacity-30'
                        : 'bg-violet-950/60 border border-violet-500/35 text-violet-200 z-[3]';
                    } else if (isActive) {
                      if (seg.type === 'lunch') {
                        blockClasses = 'bg-amber-500 ring-1 ring-amber-300/80 z-10 text-zinc-950';
                      } else if (seg.type === 'pre_market') {
                        blockClasses = 'bg-sky-500 ring-1 ring-sky-300/80 z-10 text-zinc-950';
                      } else {
                        blockClasses = 'bg-emerald-500 ring-1 ring-emerald-300/80 z-10 text-zinc-950';
                      }
                    } else if (isUpcoming) {
                      if (seg.type === 'lunch') {
                        blockClasses = 'bg-amber-500/20 border border-amber-500/45 text-amber-200';
                      } else if (seg.type === 'pre_market') {
                        blockClasses = 'bg-sky-500/20 border border-sky-500/45 text-sky-200';
                      } else {
                        blockClasses = 'bg-emerald-500/20 border border-emerald-500/45 text-emerald-100';
                      }
                    } else {
                      if (seg.type === 'lunch') {
                        blockClasses = 'bg-amber-500/[0.08] border border-amber-500/20 text-amber-400/60';
                      } else if (seg.type === 'pre_market') {
                        blockClasses = 'bg-sky-500/[0.08] border border-sky-500/20 text-sky-400/60';
                      } else {
                        blockClasses = 'bg-emerald-500/[0.08] border border-emerald-500/20 text-emerald-300/60';
                      }
                    }

                    let glowClass = '';
                    if (isSegFullHoliday) {
                      glowClass = 'shadow-[0_0_12px_rgba(168,85,247,0.45)]';
                    } else if (seg.type === 'lunch') {
                      glowClass = isDirectlyFocused
                        ? 'shadow-[0_0_14px_rgba(245,158,11,0.5)]'
                        : 'shadow-[0_0_10px_rgba(245,158,11,0.35)]';
                    } else if (seg.type === 'pre_market') {
                      glowClass = isDirectlyFocused
                        ? 'shadow-[0_0_14px_rgba(56,189,248,0.5)]'
                        : 'shadow-[0_0_10px_rgba(56,189,248,0.35)]';
                    } else {
                      glowClass = isDirectlyFocused
                        ? 'shadow-[0_0_14px_rgba(16,185,129,0.5)]'
                        : 'shadow-[0_0_10px_rgba(16,185,129,0.35)]';
                    }

                    let interactiveStateClass = '';
                    if (isDirectlyFocused) {
                      interactiveStateClass = `scale-y-[1.18] brightness-125 z-20 ring-1 ring-white/80 ${glowClass}`;
                    } else if (isCrossedByHover) {
                      interactiveStateClass = `scale-y-[1.10] brightness-115 z-10 ring-1 ring-white/45 ${glowClass}`;
                    } else if (isDimmed) {
                      interactiveStateClass = 'opacity-65';
                    }

                    const earlyCloseBorderClass =
                      !isSegFullHoliday && segHoliday?.isEarlyClose
                        ? 'border-r-2 border-r-amber-400'
                        : '';

                    const inlineVisibility = canShowInlineBarLabel(seg, marketEvents);
                    const tooltipText = getSegmentTooltip(market.name, seg);

                    return (
                      <button
                        key={idx}
                        type="button"
                        title={tooltipText}
                        aria-label={tooltipText}
                        aria-pressed={
                          Boolean(
                            pinnedSegment &&
                              pinnedSegment.marketId === market.id &&
                              pinnedSegment.segmentIndex === idx
                          )
                        }
                        onMouseEnter={() =>
                          onHoveredSegmentChange({ marketId: market.id, segmentIndex: idx })
                        }
                        onMouseLeave={() => onHoveredSegmentChange(null)}
                        onFocus={() =>
                          onHoveredSegmentChange({ marketId: market.id, segmentIndex: idx })
                        }
                        onBlur={() => onHoveredSegmentChange(null)}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (justSlidRef.current) return;
                          onTogglePinnedSegment({ marketId: market.id, segmentIndex: idx });
                        }}
                        className={`absolute top-0 bottom-0 flex items-center justify-center text-[11px] font-semibold rounded-xs overflow-hidden whitespace-nowrap origin-center transition-[transform,filter,box-shadow,background-color,border-color,opacity] duration-150 ease-out cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${blockClasses} ${earlyCloseBorderClass} ${interactiveStateClass}`}
                        style={{
                          left: `${leftPercent}%`,
                          width: `${widthPercent}%`
                        }}
                      >
                        {isSegFullHoliday && !isAllDayHoliday ? (
                          <span className="font-mono text-[9.5px] sm:text-[10px] font-medium text-violet-200 tracking-wider px-1.5 truncate pointer-events-none">
                            Feriado: {segHoliday?.name}
                          </span>
                        ) : (
                          inlineVisibility.desktop && (
                            <span className="hidden sm:inline font-mono text-[10px] font-semibold tracking-tight tabular-nums px-1.5 truncate pointer-events-none">
                              {formatSegmentBarLabel(seg)}
                            </span>
                          )
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Event markers layer */}
                {marketEvents.length > 0 && (
                  <div className="absolute inset-0 pointer-events-none z-[15]">
                    {marketEvents.map((evt, evtIdx) => {
                      const prevEvt = evtIdx > 0 ? marketEvents[evtIdx - 1] : undefined;
                      const nextEvt = evtIdx < marketEvents.length - 1 ? marketEvents[evtIdx + 1] : undefined;
                      const nearPrev = Boolean(prevEvt && Math.abs(evt.leftPercent - prevEvt.leftPercent) <= 2.5);
                      const nearNext = Boolean(nextEvt && Math.abs(nextEvt.leftPercent - evt.leftPercent) <= 2.5);
                      const positionClass =
                        nearPrev || nearNext
                          ? evtIdx % 2 === 0
                            ? '-translate-y-[85%]'
                            : '-translate-y-[15%]'
                          : undefined;

                      return (
                        <TimelineEventMarker
                          key={evt.id}
                          event={evt}
                          marketFlag={market.flag}
                          isTopRow={marketIdx <= 1}
                          isHovered={hoveredEventId === evt.id}
                          onHoverChange={(hovered) => setHoveredEventId(hovered ? evt.id : null)}
                          onEventClick={onEventClick}
                          positionClass={positionClass}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Persistent "Now" Line (only when viewing today) */}
      {showNowLine && (
        <div
          className="absolute top-0 bottom-0 -translate-x-1/2 w-[1.5px] bg-rose-500 z-[12] pointer-events-none"
          style={{ left: `${nowPercent}%` }}
        >
          <div
            className="absolute top-0.5 sm:top-1.5 left-0 inline-flex items-center gap-1 sm:gap-1.5 bg-rose-600 text-white font-mono text-[9.5px] sm:text-[11px] font-bold px-1.5 sm:px-2.5 py-0.5 rounded shadow-sm whitespace-nowrap tabular-nums"
            style={{
              transform:
                nowPercent < 12
                  ? 'translate(4px, 0)'
                  : nowPercent > 88
                  ? 'translate(calc(-100% - 4px), 0)'
                  : 'translateX(-50%)'
            }}
          >
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            <span>
              <span className="hidden sm:inline">
                AHORA {formatMinutes(currentMinutes)}
              </span>
              <span className="sm:hidden text-[9.5px] font-bold">
                {formatMinutes(currentMinutes)}
              </span>
            </span>
          </div>
        </div>
      )}

      {/* Ephemeral Hover / Touch-Slide Inspection Hairline */}
      {hoverPercent !== null && (
        <div
          className="absolute top-0 bottom-0 -translate-x-1/2 w-[1.5px] bg-sky-400/85 shadow-[0_0_8px_rgba(56,189,248,0.55)] z-[13] pointer-events-none"
          style={{ left: `${hoverPercent}%` }}
        >
          <div
            className="absolute top-0.5 sm:top-1.5 left-0 inline-flex items-center bg-sky-400 text-zinc-950 font-mono text-[9.5px] sm:text-[11px] font-bold px-1.5 sm:px-2 py-0.5 rounded shadow-sm whitespace-nowrap tabular-nums"
            style={{
              transform:
                hoverPercent < 12
                  ? 'translate(4px, 0)'
                  : hoverPercent > 88
                  ? 'translate(calc(-100% - 4px), 0)'
                  : 'translateX(-50%)'
            }}
          >
            {hoverTimeLabel}
          </div>
        </div>
      )}
    </div>
  );
});

TimelineBars.displayName = 'TimelineBars';
