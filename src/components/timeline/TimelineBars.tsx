import React from 'react';
import { MarketConfig, MarketEvaluation, TimelineSegment, TimelineEventMarkerData } from '../../core/types';
import { formatMinutes } from '../../core/timezone';
import { TimelineEventMarker } from './TimelineEventMarker';

const HOURS = [0, 3, 6, 9, 12, 15, 18, 21, 24];
const GRID_LINES = Array.from({ length: 25 }, (_, i) => i);

interface TimelineBarsProps {
  allMarkets: MarketConfig[];
  marketSegments: Record<string, TimelineSegment[]>;
  scrubberEvaluations: Record<string, MarketEvaluation>;
  chileScrubberEvaluation: MarketEvaluation;
  scrubberMinutes: number;
  currentMinutes: number;
  isHovering: boolean;
  isColumnCollapsed: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
  dailyEvents?: Record<string, TimelineEventMarkerData[]>;
  onSelectEvent?: (marketId: string) => void;
  onEventClick?: (event: TimelineEventMarkerData) => void;
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerCancel?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerLeave: (e: React.PointerEvent<HTMLDivElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  isToday?: boolean;
}

export const TimelineBars: React.FC<TimelineBarsProps> = React.memo(({
  allMarkets,
  marketSegments,
  scrubberEvaluations,
  chileScrubberEvaluation,
  scrubberMinutes,
  currentMinutes,
  isHovering,
  isColumnCollapsed,
  containerRef,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onPointerLeave,
  onKeyDown,
  dailyEvents = {},
  onSelectEvent,
  onEventClick,
  isToday = true
}) => {
  const [activeEventId, setActiveEventId] = React.useState<string | null>(null);
  const [hoveredEventId, setHoveredEventId] = React.useState<string | null>(null);

  const currentActiveEventId = activeEventId || hoveredEventId;

  React.useEffect(() => {
    if (!activeEventId) return;
    const handleGlobalPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target?.closest('[data-timeline-marker]')) {
        setActiveEventId(null);
      }
    };
    document.addEventListener('pointerdown', handleGlobalPointerDown);
    return () => document.removeEventListener('pointerdown', handleGlobalPointerDown);
  }, [activeEventId]);

  const scrubberPercent = (scrubberMinutes / 1440) * 100;
  const nowPercent = (currentMinutes / 1440) * 100;
  const isActivelyScrubbing = isHovering && Math.abs(scrubberMinutes - currentMinutes) > 2;

  const renderCollapsedFloatingPills = (linePercent: number) => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    const isTablet = typeof window !== 'undefined' && window.innerWidth < 768;
    // Header uses h-9 (36px) on <640px and sm:h-11 (44px) on >=640px
    const headerHeight = isMobile ? 36 : 44;
    const rowHeight = isMobile ? 38 : isTablet ? 46 : 50;

    const edgeTransform =
      linePercent < 4
        ? 'translate(6px, -50%)'
        : linePercent > 96
        ? 'translate(calc(-100% - 6px), -50%)'
        : 'translate(-50%, -50%)';

    return (
      <div className="absolute top-0 left-0 w-0 h-full pointer-events-none">
        {allMarkets.map((market, idx) => {
          const isChile = market.id === 'chile';
          const ev = isChile
            ? chileScrubberEvaluation
            : (scrubberEvaluations[market.id] ?? {
                marketId: market.id,
                status: 'closed',
                localTimeFormatted: '--:--',
                localDateFormatted: ''
              });

          const topPx = headerHeight + idx * rowHeight + rowHeight / 2;

          let statusClasses = 'border-border text-zinc-300';
          if (ev.holiday && !ev.holiday.isEarlyClose) {
            statusClasses = 'border-violet-500/45 text-violet-300';
          } else if (isChile) {
            statusClasses = 'border-sky-500/45 text-sky-300';
          } else if (ev.status === 'open') {
            statusClasses = 'border-emerald-500/45 text-emerald-300';
          } else if (ev.status === 'lunch') {
            statusClasses = 'border-amber-500/45 text-amber-300';
          } else if (ev.status === 'pre_market') {
            statusClasses = 'border-sky-500/45 text-sky-300';
          }

          return (
            <div
              key={market.id}
              className={`absolute left-0 inline-flex items-center gap-1.5 bg-popover/95 border rounded-md px-2 py-0.5 font-mono text-[10px] sm:text-xs font-semibold whitespace-nowrap shadow-md z-10 pointer-events-none tabular-nums ${statusClasses}`}
              style={{
                top: `${topPx}px`,
                transform: edgeTransform
              }}
              title={`${market.name}: ${ev.localTimeFormatted}${ev.holiday ? ` (Feriado: ${ev.holiday.name})` : ''}`}
            >
              <span className="text-xs leading-none">{market.flag}</span>
              <span>{ev.localTimeFormatted}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div
      className="timeline-bars-container flex-1 w-full min-w-0 relative flex flex-col cursor-crosshair touch-pan-y select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50"
      ref={containerRef}
      tabIndex={0}
      role="slider"
      aria-label="Cursor interactivo de línea de tiempo"
      aria-valuemin={0}
      aria-valuemax={1440}
      aria-valuenow={scrubberMinutes}
      aria-valuetext={`Hora de Chile ${formatMinutes(scrubberMinutes)}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onPointerLeave={onPointerLeave}
      onKeyDown={onKeyDown}
    >
      {/* Hour Labels at Top */}
      <div className="h-9 sm:h-11 relative border-b border-border bg-muted">
        {HOURS.map((h) => {
          const transform =
            h === 0
              ? 'translate(4px, -50%)'
              : h === 24
              ? 'translate(calc(-100% - 4px), -50%)'
              : 'translate(-50%, -50%)';

          return (
            <div
              key={h}
              className="absolute top-1/2 font-mono text-[9px] sm:text-xs font-semibold text-muted-foreground tabular-nums select-none"
              style={{ left: `${(h / 24) * 100}%`, transform }}
            >
              <span className="hidden sm:inline">{h.toString().padStart(2, '0')}:00</span>
              <span className="sm:hidden">{h.toString().padStart(2, '0')}h</span>
            </div>
          );
        })}
      </div>

      {/* Background Vertical Grid Lines */}
      <div className="absolute top-9 sm:top-11 bottom-0 left-0 right-0 pointer-events-none z-[1]">
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
        {allMarkets.map((market, marketIdx) => {
          const isChile = market.id === 'chile';
          const segments = isChile ? [] : (marketSegments[market.id] ?? []);
          const marketEvents = dailyEvents[market.id] ?? [];
          const isRowElevated = marketEvents.some((e) => e.id === currentActiveEventId);
          const ev = isChile ? chileScrubberEvaluation : scrubberEvaluations[market.id];
          const holiday = ev?.holiday;
          const isChileFullHoliday = Boolean(isChile && holiday && !holiday.isEarlyClose);
          const isAllDayHoliday =
            !isChile &&
            segments.length > 0 &&
            segments.every((s) => Boolean(s.holiday && !s.holiday.isEarlyClose));
          const isHoliday = isAllDayHoliday;
          const rowHoliday = isAllDayHoliday ? (segments[0]?.holiday ?? holiday) : holiday;

          return (
            <div
              key={market.id}
              className={`relative h-[38px] sm:h-[46px] md:h-[50px] px-1.5 sm:px-2 flex items-center border-b border-border transition-colors ${
                isRowElevated ? 'z-40' : 'hover:z-30 focus-within:z-40'
              } ${
                isChile
                  ? 'bg-white/[0.015]'
                  : 'hover:bg-white/[0.015]'
              } ${isHoliday ? 'opacity-45 hover:opacity-75 transition-opacity' : ''}`}
            >
              <div
                className={`relative w-full h-[22px] sm:h-[26px] md:h-[28px] border rounded-md transition-colors ${
                  (isHoliday || isChileFullHoliday)
                    ? 'border-violet-500/25 bg-violet-950/15'
                    : 'border-border bg-card/70'
                }`}
              >
                {/* Session blocks container (clipped to rounded track) */}
                <div className="absolute inset-0 rounded-md overflow-hidden pointer-events-none z-[2]">
                  {/* Chile reference track */}
                  {isChile && (
                    holiday ? (
                      <div className="w-full h-full flex items-center justify-center bg-violet-500/10">
                        <span className="font-mono text-[10px] sm:text-[11px] font-semibold text-violet-300 tracking-wider uppercase px-2 truncate">
                          Eje 24h Santiago · {holiday.isEarlyClose ? holiday.name : `Feriado: ${holiday.name}`}
                        </span>
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-white/[0.02]">
                        <span className="font-mono text-[10px] sm:text-[11px] font-medium text-zinc-400 tracking-widest uppercase">
                          Eje 24h Santiago de Chile
                        </span>
                      </div>
                    )
                  )}

                  {/* Holiday track overlay */}
                  {isHoliday && (
                    <div className="absolute inset-0 flex items-center justify-center bg-violet-950/40 rounded-md z-[3]">
                      <span className="font-mono text-[9px] sm:text-[10px] font-medium text-violet-200 tracking-wider px-2 py-0.5 rounded bg-violet-950/80 border border-violet-500/30 truncate max-w-[180px] sm:max-w-none">
                        Feriado: {rowHoliday?.name}
                      </span>
                    </div>
                  )}

                  {/* Session blocks */}
                  {segments.map((seg, idx) => {
                    const leftPercent = (seg.startMinute / 1440) * 100;
                    const widthPercent = ((seg.endMinute - seg.startMinute) / 1440) * 100;
                    const segHoliday = seg.holiday;
                    const isSegFullHoliday = Boolean(segHoliday && !segHoliday.isEarlyClose);
                    const isActive = !isSegFullHoliday && scrubberMinutes >= seg.startMinute && scrubberMinutes < seg.endMinute;
                    const isUpcoming = !isSegFullHoliday && scrubberMinutes < seg.startMinute;

                    let blockClasses = '';
                    let statusDescriptor = 'Cerrado';

                    if (isSegFullHoliday) {
                      blockClasses = isAllDayHoliday
                        ? 'bg-zinc-800/40 border border-white/5 opacity-30'
                        : 'bg-violet-950/60 border border-violet-500/35 text-violet-200 z-[3]';
                      statusDescriptor = segHoliday ? `Feriado: ${segHoliday.name}` : 'Feriado';
                    } else if (isActive) {
                      statusDescriptor = 'Abierto ahora';
                      if (seg.type === 'lunch') {
                        blockClasses = 'bg-amber-500 ring-1 ring-amber-300/80 z-10 text-zinc-950';
                      } else if (seg.type === 'pre_market') {
                        blockClasses = 'bg-sky-500 ring-1 ring-sky-300/80 z-10 text-zinc-950';
                      } else {
                        blockClasses = 'bg-emerald-500 ring-1 ring-emerald-300/80 z-10 text-zinc-950';
                      }
                    } else if (isUpcoming) {
                      statusDescriptor = 'Aún no abre';
                      if (seg.type === 'lunch') {
                        blockClasses = 'bg-amber-500/20 border border-amber-500/45 text-amber-300';
                      } else if (seg.type === 'pre_market') {
                        blockClasses = 'bg-sky-500/20 border border-sky-500/45 text-sky-300';
                      } else {
                        blockClasses = 'bg-emerald-500/20 border border-emerald-500/45 text-emerald-300';
                      }
                    } else {
                      // isPast
                      statusDescriptor = 'Ya cerró';
                      if (seg.type === 'lunch') {
                        blockClasses = 'bg-amber-500/[0.08] border border-amber-500/20 text-amber-500/40';
                      } else if (seg.type === 'pre_market') {
                        blockClasses = 'bg-sky-500/[0.08] border border-sky-500/20 text-sky-500/40';
                      } else {
                        blockClasses = 'bg-emerald-500/[0.08] border border-emerald-500/20 text-emerald-500/40';
                      }
                    }

                    return (
                      <div
                        key={idx}
                        className={`absolute top-0 bottom-0 flex items-center justify-center text-[11px] font-semibold rounded-xs overflow-hidden whitespace-nowrap transition-colors duration-150 ${blockClasses}`}
                        style={{
                          left: `${leftPercent}%`,
                          width: `${widthPercent}%`
                        }}
                        title={`${market.name} - ${seg.label ?? seg.type}: ${(seg.startMinute / 60).toFixed(1)}h - ${(seg.endMinute / 60).toFixed(1)}h (Chile) — [${statusDescriptor}]`}
                      >
                        {isSegFullHoliday && !isAllDayHoliday && (
                          <span className="font-mono text-[9px] sm:text-[10px] font-medium text-violet-200 tracking-wider px-1.5 truncate">
                            Feriado: {segHoliday?.name}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Event markers layer (unclipped for popover/tooltip) */}
                {marketEvents.length > 0 && (
                  <div className="absolute inset-0 pointer-events-none z-[4]">
                    {marketEvents.map((evt) => (
                      <TimelineEventMarker
                        key={evt.id}
                        event={evt}
                        marketFlag={market.flag}
                        isTopRow={marketIdx <= 1}
                        isOpen={currentActiveEventId === evt.id}
                        onOpenToggle={() =>
                          setActiveEventId((prev) => (prev === evt.id ? null : evt.id))
                        }
                        onHoverChange={(isHovered) =>
                          setHoveredEventId(isHovered ? evt.id : null)
                        }
                        onSelectEvent={onSelectEvent}
                        onEventClick={onEventClick}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Persistent "Now" Line (only active when viewing current day) */}
      {isToday && (
        <div
          className="absolute top-0 bottom-0 -translate-x-1/2 w-[1.5px] bg-rose-500 z-[5] pointer-events-none"
          style={{ left: `${nowPercent}%` }}
        >
          <div
            className="absolute top-1 sm:top-1.5 left-0 inline-flex items-center gap-1 sm:gap-1.5 bg-rose-600 text-white font-mono text-[10px] sm:text-[11px] font-bold px-2 sm:px-2.5 py-0.5 rounded shadow-sm whitespace-nowrap tabular-nums"
            style={{
              transform:
                nowPercent < 4
                  ? 'translate(6px, 0)'
                  : nowPercent > 96
                  ? 'translate(calc(-100% - 6px), 0)'
                  : 'translateX(-50%)'
            }}
          >
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            <span>
              <span className="hidden sm:inline">
                {isActivelyScrubbing
                  ? 'AHORA'
                  : `AHORA 🇨🇱 ${formatMinutes(currentMinutes)}`}
              </span>
              <span className="sm:hidden text-[9px] font-bold">
                {isActivelyScrubbing
                  ? 'AHORA'
                  : `${formatMinutes(currentMinutes)}`}
              </span>
            </span>
          </div>

          {isColumnCollapsed && !isActivelyScrubbing && renderCollapsedFloatingPills(nowPercent)}
        </div>
      )}

      {/* Interactive Scrubber Line */}
      {(isActivelyScrubbing || !isToday || isHovering) && (
        <div
          className="absolute top-0 bottom-0 -translate-x-1/2 w-[2px] bg-sky-400 z-[6] pointer-events-none"
          style={{ left: `${scrubberPercent}%` }}
        >
          <div
            className="absolute top-1 sm:top-1.5 left-0 bg-sky-500 text-zinc-950 font-mono text-[10px] sm:text-[11px] font-bold px-2 sm:px-2.5 py-0.5 rounded shadow-sm whitespace-nowrap tabular-nums"
            style={{
              transform:
                scrubberPercent < 4
                  ? 'translate(6px, 0)'
                  : scrubberPercent > 96
                  ? 'translate(calc(-100% - 6px), 0)'
                  : 'translateX(-50%)'
            }}
          >
            <span className="hidden sm:inline">🇨🇱 </span>
            <span>{formatMinutes(scrubberMinutes)}</span>
            {!isToday && (
              <span className="ml-1 text-[9px] font-medium text-zinc-900">
                proyección
              </span>
            )}
          </div>

          {isColumnCollapsed && renderCollapsedFloatingPills(scrubberPercent)}
        </div>
      )}
    </div>
  );
});

TimelineBars.displayName = 'TimelineBars';
