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
  onPointerLeave: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
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
  onEventClick
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

  return (
    <div
      className="timeline-bars-container flex-1 min-w-[800px] relative flex flex-col cursor-crosshair touch-none select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50"
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
              ? 'translate(6px, -50%)'
              : h === 24
              ? 'translate(calc(-100% - 6px), -50%)'
              : 'translate(-50%, -50%)';

          return (
            <div
              key={h}
              className="absolute top-1/2 font-mono text-[10px] sm:text-xs font-semibold text-muted-foreground tabular-nums select-none"
              style={{ left: `${(h / 24) * 100}%`, transform }}
            >
              {h.toString().padStart(2, '0')}:00
            </div>
          );
        })}
      </div>

      {/* Background Vertical Grid Lines */}
      <div className="absolute top-9 sm:top-11 bottom-0 left-0 right-0 pointer-events-none z-[1]">
        {GRID_LINES.map((h) => (
          <div
            key={h}
            className={`absolute top-0 bottom-0 w-[1px] ${h % 3 === 0 ? 'bg-white/[0.08]' : 'bg-white/[0.02]'}`}
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

          return (
            <div
              key={market.id}
              className={`relative h-[38px] sm:h-[46px] md:h-[50px] px-1.5 sm:px-2 flex items-center border-b border-border transition-colors ${
                isRowElevated ? 'z-40' : 'hover:z-30 focus-within:z-40'
              } ${
                isChile ? 'bg-gradient-to-r from-sky-400/[0.08] to-sky-400/[0.02] border-b-sky-400/35' : 'hover:bg-white/[0.02]'
              }`}
            >
              <div className="relative w-full h-[22px] sm:h-[26px] md:h-[30px] bg-white/[0.02] border border-border rounded sm:rounded-lg shadow-[inset_0_2px_6px_rgba(0,0,0,0.5)]">
                {/* Session blocks container (clipped to rounded track) */}
                <div className="absolute inset-0 rounded sm:rounded-lg overflow-hidden pointer-events-none z-[2]">
                  {/* Chile reference track */}
                  {isChile && (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-sky-400/[0.06] via-sky-400/[0.16] to-sky-400/[0.06]">
                      <span className="font-mono text-xs font-bold text-sky-400 tracking-wider uppercase">
                        Eje 24h Santiago de Chile
                      </span>
                    </div>
                  )}

                  {/* Session blocks */}
                  {segments.map((seg, idx) => {
                    const leftPercent = (seg.startMinute / 1440) * 100;
                    const widthPercent = ((seg.endMinute - seg.startMinute) / 1440) * 100;
                    const isActive = scrubberMinutes >= seg.startMinute && scrubberMinutes < seg.endMinute;

                    let blockStyle = 'bg-gradient-to-b from-emerald-500 to-emerald-600';
                    let shadowStyle = 'shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_2px_8px_rgba(0,0,0,0.5),0_0_16px_rgba(16,185,129,0.30)]';
                    let activeShadowStyle = 'shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_2px_8px_rgba(0,0,0,0.5),0_0_28px_rgba(16,185,129,0.80)]';
                    if (seg.type === 'lunch') {
                      blockStyle = 'bg-gradient-to-b from-amber-500 to-amber-600';
                      shadowStyle = 'shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_2px_8px_rgba(0,0,0,0.5),0_0_16px_rgba(245,158,11,0.30)]';
                      activeShadowStyle = 'shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_2px_8px_rgba(0,0,0,0.5),0_0_28px_rgba(245,158,11,0.80)]';
                    } else if (seg.type === 'pre_market') {
                      blockStyle = 'bg-gradient-to-b from-cyan-500 to-sky-600';
                      shadowStyle = 'shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_2px_8px_rgba(0,0,0,0.5),0_0_16px_rgba(34,211,238,0.30)]';
                      activeShadowStyle = 'shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_2px_8px_rgba(0,0,0,0.5),0_0_28px_rgba(34,211,238,0.80)]';
                    }

                    return (
                      <div
                        key={idx}
                        className={`absolute top-0 bottom-0 flex items-center justify-center text-[11px] font-bold rounded-md overflow-hidden whitespace-nowrap transition-[box-shadow] ${blockStyle} ${
                          isActive ? `ring-2 ring-white ${activeShadowStyle}` : shadowStyle
                        }`}
                        style={{
                          left: `${leftPercent}%`,
                          width: `${widthPercent}%`
                        }}
                        title={`${market.name} - ${seg.label ?? seg.type}: ${(seg.startMinute / 60).toFixed(1)}h - ${(seg.endMinute / 60).toFixed(1)}h (Chile)`}
                      />
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

      {/* Persistent "Now" Line */}
      <div
        className="absolute top-0 bottom-0 -translate-x-1/2 w-[2px] bg-rose-600 shadow-[0_0_14px_rgba(225,29,72,0.65)] z-[5] pointer-events-none"
        style={{ left: `${nowPercent}%` }}
      >
        <div
          className="absolute top-1 sm:top-1.5 left-0 inline-flex items-center gap-1 sm:gap-1.5 bg-rose-600 text-white font-mono text-[10px] sm:text-xs font-extrabold px-2 sm:px-3 py-0.5 sm:py-1 rounded sm:rounded-lg shadow-[0_4px_14px_rgba(225,29,72,0.65)] whitespace-nowrap tabular-nums"
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
            {isActivelyScrubbing
              ? 'AHORA'
              : `AHORA 🇨🇱 ${formatMinutes(currentMinutes)}`}
          </span>
        </div>

        {/* When left column is collapsed and idle, show current country times on Now line */}
        {isColumnCollapsed && !isActivelyScrubbing && (
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

              const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
              const isTablet = typeof window !== 'undefined' && window.innerWidth < 768;
              const headerHeight = isMobile ? 36 : isTablet ? 40 : 44;
              const rowHeight = isMobile ? 38 : isTablet ? 46 : 50;
              const topPx = headerHeight + idx * rowHeight + rowHeight / 2;

              const edgeTransform =
                nowPercent < 4
                  ? 'translate(6px, -50%)'
                  : nowPercent > 96
                  ? 'translate(calc(-100% - 6px), -50%)'
                  : 'translate(-50%, -50%)';

              let statusClasses = 'border-border text-foreground/80';
              if (isChile) {
                statusClasses = 'border-sky-400/70 text-sky-300 shadow-[0_4px_14px_rgba(0,0,0,0.75),0_0_12px_rgba(56,189,248,0.25)]';
              } else if (ev.status === 'open') {
                statusClasses = 'border-emerald-500/70 text-emerald-300 shadow-[0_4px_14px_rgba(0,0,0,0.75),0_0_12px_rgba(16,185,129,0.3)]';
              } else if (ev.status === 'lunch') {
                statusClasses = 'border-amber-500/70 text-amber-300 shadow-[0_4px_14px_rgba(0,0,0,0.75),0_0_10px_rgba(245,158,11,0.3)]';
              } else if (ev.status === 'pre_market') {
                statusClasses = 'border-cyan-500/70 text-cyan-300 shadow-[0_4px_14px_rgba(0,0,0,0.75),0_0_10px_rgba(6,182,212,0.3)]';
              }

              return (
                <div
                  key={market.id}
                  className={`absolute left-0 inline-flex items-center gap-1.5 sm:gap-2 bg-popover/95 backdrop-blur-md border rounded-md sm:rounded-lg px-2 sm:px-3 py-0.5 sm:py-1 font-mono text-[10px] sm:text-xs font-bold whitespace-nowrap shadow-neon z-10 pointer-events-none tabular-nums ${statusClasses}`}
                  style={{
                    top: `${topPx}px`,
                    transform: edgeTransform
                  }}
                  title={`${market.name}: ${ev.localTimeFormatted}`}
                >
                  <span className="text-xs leading-none">{market.flag}</span>
                  <span>{ev.localTimeFormatted}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Interactive Scrubber Line */}
      {isActivelyScrubbing && (
        <div
          className="absolute top-0 bottom-0 -translate-x-1/2 w-[2.5px] bg-sky-400 shadow-[0_0_16px_rgba(56,189,248,0.75)] z-[6] pointer-events-none"
          style={{ left: `${scrubberPercent}%` }}
        >
          <div
            className="absolute top-1 sm:top-1.5 left-0 bg-gradient-to-br from-sky-600 to-sky-700 text-white font-mono text-[10px] sm:text-xs font-extrabold px-2 sm:px-3 py-0.5 sm:py-1 rounded sm:rounded-lg border border-border-strong shadow-[0_4px_16px_rgba(2,132,199,0.7)] whitespace-nowrap tabular-nums"
            style={{
              transform:
                scrubberPercent < 4
                  ? 'translate(6px, 0)'
                  : scrubberPercent > 96
                  ? 'translate(calc(-100% - 6px), 0)'
                  : 'translateX(-50%)'
            }}
          >
            <span>🇨🇱 {formatMinutes(scrubberMinutes)}</span>
          </div>

          {/* When left column is collapsed and scrubbing, show projected country times on scrubber line */}
          {isColumnCollapsed && (
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

                const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
                const isTablet = typeof window !== 'undefined' && window.innerWidth < 768;
                const headerHeight = isMobile ? 36 : isTablet ? 40 : 44;
                const rowHeight = isMobile ? 38 : isTablet ? 46 : 50;
                const topPx = headerHeight + idx * rowHeight + rowHeight / 2;

                const edgeTransform =
                  scrubberPercent < 4
                    ? 'translate(6px, -50%)'
                    : scrubberPercent > 96
                    ? 'translate(calc(-100% - 6px), -50%)'
                    : 'translate(-50%, -50%)';

                let statusClasses = 'border-border text-foreground/80';
                if (isChile) {
                  statusClasses = 'border-sky-400/70 text-sky-300 shadow-[0_4px_14px_rgba(0,0,0,0.75),0_0_12px_rgba(56,189,248,0.25)]';
                } else if (ev.status === 'open') {
                  statusClasses = 'border-emerald-500/70 text-emerald-300 shadow-[0_4px_14px_rgba(0,0,0,0.75),0_0_12px_rgba(16,185,129,0.3)]';
                } else if (ev.status === 'lunch') {
                  statusClasses = 'border-amber-500/70 text-amber-300 shadow-[0_4px_14px_rgba(0,0,0,0.75),0_0_10px_rgba(245,158,11,0.3)]';
                } else if (ev.status === 'pre_market') {
                  statusClasses = 'border-cyan-500/70 text-cyan-300 shadow-[0_4px_14px_rgba(0,0,0,0.75),0_0_10px_rgba(6,182,212,0.3)]';
                }

                return (
                  <div
                    key={market.id}
                    className={`absolute left-0 inline-flex items-center gap-1.5 sm:gap-2 bg-popover/95 backdrop-blur-md border rounded-md sm:rounded-lg px-2 sm:px-3 py-0.5 sm:py-1 font-mono text-[10px] sm:text-xs font-bold whitespace-nowrap shadow-neon z-10 pointer-events-none tabular-nums ${statusClasses}`}
                    style={{
                      top: `${topPx}px`,
                      transform: edgeTransform
                    }}
                    title={`${market.name}: ${ev.localTimeFormatted}`}
                  >
                    <span className="text-xs leading-none">{market.flag}</span>
                    <span>{ev.localTimeFormatted}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

TimelineBars.displayName = 'TimelineBars';
