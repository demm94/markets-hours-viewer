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
  isPinned?: boolean;
  isColumnCollapsed: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
  dailyEvents?: Record<string, TimelineEventMarkerData[]>;
  onEventClick?: (event: TimelineEventMarkerData) => void;
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerCancel?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerLeave: (e: React.PointerEvent<HTMLDivElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  isToday?: boolean;
  isWeekendDay?: boolean;
  simulateWeekday?: boolean;
}

export const TimelineBars: React.FC<TimelineBarsProps> = React.memo(({
  allMarkets,
  marketSegments,
  scrubberEvaluations,
  chileScrubberEvaluation,
  scrubberMinutes,
  currentMinutes,
  isHovering,
  isPinned = false,
  isColumnCollapsed,
  containerRef,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onPointerLeave,
  onKeyDown,
  dailyEvents = {},
  onEventClick,
  isToday = true,
  isWeekendDay = false,
  simulateWeekday = false
}) => {
  const [hoveredEventId, setHoveredEventId] = React.useState<string | null>(null);

  const scrubberPercent = (scrubberMinutes / 1440) * 100;
  const nowPercent = (currentMinutes / 1440) * 100;
  const isActivelyScrubbing = isPinned || (isHovering && Math.abs(scrubberMinutes - currentMinutes) > 2);
  const showNowLine = isToday;
  const showScrubberLine = isActivelyScrubbing || !isToday || isHovering;
  const scrubberTimeLabel = scrubberMinutes === 1440 ? '24:00' : formatMinutes(scrubberMinutes);

  const renderCollapsedFloatingPills = (linePercent: number) => {
    const edgeTransform =
      linePercent < 12
        ? 'translate(6px, -50%)'
        : linePercent > 88
        ? 'translate(calc(-100% - 6px), -50%)'
        : 'translate(-50%, -50%)';

    return (
      <div className="absolute top-0 left-0 w-0 h-full pointer-events-none">
        {allMarkets.map((market, idx) => {
          const isChile = market.id === 'chile';
          const rowEvents = dailyEvents[market.id] ?? [];
          if (rowEvents.some((evt) => Math.abs(evt.leftPercent - linePercent) < 8)) {
            return null;
          }

          const ev = isChile
            ? chileScrubberEvaluation
            : (scrubberEvaluations[market.id] ?? {
                marketId: market.id,
                status: 'closed',
                localTimeFormatted: '--:--',
                localDateFormatted: ''
              });

          const topCalc = `calc(var(--timeline-header-h, 36px) + ${idx + 0.5} * var(--timeline-row-h, 38px))`;

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
                top: topCalc,
                transform: edgeTransform
              }}
              title={`${market.name}: ${ev.localTimeFormatted}${ev.holiday ? ` (Feriado: ${ev.holiday.name})` : ''}`}
            >
              <span className="text-xs leading-none" aria-hidden="true">{market.flag}</span>
              <span>{ev.localTimeFormatted}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div
      className="timeline-bars-container flex-1 w-full min-w-[460px] sm:min-w-[600px] lg:min-w-0 relative flex flex-col cursor-crosshair touch-pan-y select-none"
      ref={containerRef}
      role="region"
      aria-label="Grilla horaria de 24 horas en hora de Chile"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onPointerLeave={onPointerLeave}
    >
      {/* Hour Labels & Accessible Keyboard Scrubber Slider (sibling to event buttons to preserve valid ARIA) */}
      <div
        tabIndex={0}
        role="slider"
        aria-label="Cursor interactivo de línea de tiempo (usa flechas izquierda, derecha, arriba o abajo para mover, Escape para volver a ahora)"
        aria-valuemin={0}
        aria-valuemax={1440}
        aria-valuenow={scrubberMinutes}
        aria-valuetext={`Hora de Chile ${scrubberTimeLabel}`}
        onKeyDown={onKeyDown}
        className="h-9 sm:h-11 relative border-b border-border bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-400/70"
      >
        {HOURS.map((h) => {
          const tickPct = (h / 24) * 100;
          const nearNow = showNowLine && Math.abs(tickPct - nowPercent) < 11;
          const nearScrubber = showScrubberLine && Math.abs(tickPct - scrubberPercent) < 11;
          const isTickHidden = nearNow || nearScrubber;

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
              className={`absolute top-1/2 font-mono text-[10px] sm:text-xs font-semibold text-muted-foreground tabular-nums select-none transition-opacity duration-150 ${
                isTickHidden ? 'opacity-0' : 'opacity-100'
              }`}
              style={{ left: `${tickPct}%`, transform }}
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
          const isRowElevated = marketEvents.some((e) => e.id === hoveredEventId);
          const ev = isChile ? chileScrubberEvaluation : scrubberEvaluations[market.id];
          const holiday = ev?.holiday;
          const isChileFullHoliday = Boolean(isChile && holiday && !holiday.isEarlyClose);
          const isAllDayHoliday =
            !isChile &&
            segments.length > 0 &&
            segments.every((s) => Boolean(s.holiday && !s.holiday.isEarlyClose));
          const isHoliday = isAllDayHoliday;
          const rowHoliday = isAllDayHoliday ? (segments[0]?.holiday ?? holiday) : holiday;
          const isEmptyWeekendTrack = !isChile && segments.length === 0 && isWeekendDay && !simulateWeekday;
          const isFuturePreview = !isToday && !isHovering && !isPinned;

          return (
            <div
              key={market.id}
              className={`relative h-[38px] sm:h-[46px] md:h-[50px] px-0 flex items-center border-b border-border transition-colors ${
                isRowElevated ? 'z-40' : ''
              } ${
                isChile
                  ? 'bg-white/[0.015]'
                  : 'hover:bg-white/[0.015]'
              } ${isHoliday ? 'opacity-75 hover:opacity-90 transition-opacity' : ''}`}
            >
              <div
                className={`relative w-full h-[22px] sm:h-[26px] md:h-[28px] border-y rounded-none transition-colors ${
                  (isHoliday || isChileFullHoliday)
                    ? 'border-violet-500/25 bg-violet-950/15'
                    : 'border-border bg-card/70'
                }`}
              >
                {/* Session blocks container */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none z-[2]">
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
                          Eje 24h Santiago · Chile
                        </span>
                      </div>
                    )
                  )}

                  {isEmptyWeekendTrack && (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="font-mono text-[10px] text-zinc-400">
                        Cerrado · Fin de semana
                      </span>
                    </div>
                  )}

                  {isHoliday && (
                    <div className="absolute inset-0 flex items-center justify-center bg-violet-950/40 z-[3]">
                      <span className="font-mono text-[10px] font-medium text-violet-200 tracking-wider px-2 py-0.5 rounded bg-violet-950/80 border border-violet-500/30 truncate max-w-[180px] sm:max-w-none">
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
                      !isFuturePreview &&
                      scrubberMinutes >= seg.startMinute &&
                      scrubberMinutes < seg.endMinute;
                    const isUpcoming =
                      !isSegFullHoliday && (isFuturePreview || scrubberMinutes < seg.startMinute);

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
                        blockClasses = 'bg-amber-500/20 border border-amber-500/45 text-amber-300';
                      } else if (seg.type === 'pre_market') {
                        blockClasses = 'bg-sky-500/20 border border-sky-500/45 text-sky-300';
                      } else {
                        blockClasses = 'bg-emerald-500/20 border border-emerald-500/45 text-emerald-300';
                      }
                    } else {
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
                      >
                        {isSegFullHoliday && !isAllDayHoliday && (
                          <span className="font-mono text-[10px] font-medium text-violet-200 tracking-wider px-1.5 truncate">
                            Feriado: {segHoliday?.name}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Event markers layer (sibling to slider, elevated above vertical lines) */}
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
                          isTopRow={marketIdx <= 2}
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
            className="absolute top-1 sm:top-1.5 left-0 inline-flex items-center gap-1 sm:gap-1.5 bg-rose-600 text-white font-mono text-[10px] sm:text-[11px] font-bold px-2 sm:px-2.5 py-0.5 rounded shadow-sm whitespace-nowrap tabular-nums"
            style={{
              transform:
                nowPercent < 12
                  ? 'translate(6px, 0)'
                  : nowPercent > 88
                  ? 'translate(calc(-100% - 6px), 0)'
                  : 'translateX(-50%)'
            }}
          >
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            <span>
              <span className="hidden sm:inline">
                {isActivelyScrubbing
                  ? 'AHORA'
                  : <>AHORA <span aria-hidden="true">🇨🇱</span> {formatMinutes(currentMinutes)}</>}
              </span>
              <span className="sm:hidden text-[10px] font-bold">
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
      {showScrubberLine && (
        <div
          className="absolute top-0 bottom-0 -translate-x-1/2 w-[2px] bg-sky-400 z-[14] pointer-events-none"
          style={{ left: `${scrubberPercent}%` }}
        >
          <div
            className="absolute top-1 sm:top-1.5 left-0 inline-flex items-center gap-1 bg-sky-500 text-zinc-950 font-mono text-[10px] sm:text-[11px] font-bold px-2 sm:px-2.5 py-0.5 rounded shadow-sm whitespace-nowrap tabular-nums"
            style={{
              transform:
                scrubberPercent < 12
                  ? 'translate(6px, 0)'
                  : scrubberPercent > 88
                  ? 'translate(calc(-100% - 6px), 0)'
                  : 'translateX(-50%)'
            }}
          >
            <span className="hidden sm:inline" aria-hidden="true">🇨🇱</span>
            <span>{scrubberTimeLabel}</span>
            {isPinned && (
              <span className="hidden sm:inline text-[10px] font-semibold bg-zinc-950/20 px-1 rounded">
                fijado
              </span>
            )}
            {!isToday && !isPinned && (
              <span className="text-[10px] font-medium text-zinc-900">
                día futuro
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
