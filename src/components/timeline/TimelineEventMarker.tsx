import React from 'react';
import { TimelineEventMarkerData } from '../../core/types';
import { Flame, AlertCircle, ExternalLink } from 'lucide-react';

interface TimelineEventMarkerProps {
  event: TimelineEventMarkerData;
  marketFlag: string;
  isTopRow?: boolean;
  isOpen: boolean;
  onOpenToggle: () => void;
  onHoverChange: (isHovered: boolean) => void;
  onSelectEvent?: (marketId: string) => void;
  onEventClick?: (event: TimelineEventMarkerData) => void;
}

export const TimelineEventMarker: React.FC<TimelineEventMarkerProps> = React.memo(({
  event,
  marketFlag,
  isTopRow = false,
  isOpen,
  onOpenToggle,
  onHoverChange,
  onSelectEvent,
  onEventClick
}) => {
  const isHigh = event.importance === 'high';
  const timeOnly = event.chileTimeFormatted.split(' ')[0]; // e.g. "15:00"

  // Position alignment to avoid edge clipping
  let tooltipAlignClass = 'left-1/2 -translate-x-1/2';
  if (event.leftPercent < 15) {
    tooltipAlignClass = 'left-0 translate-x-0';
  } else if (event.leftPercent > 85) {
    tooltipAlignClass = 'right-0 translate-x-0';
  }

  const verticalPositionClass = isTopRow
    ? 'top-full mt-2'
    : 'bottom-full mb-2';

  return (
    <div
      data-timeline-marker="true"
      className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-auto ${
        isOpen ? 'z-50' : 'z-20 hover:z-40'
      }`}
      style={{ left: `${event.leftPercent}%` }}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
    >
      {/* Interactive Chip / Pin */}
      <button
        type="button"
        aria-label={`${event.title} - ${event.chileTimeFormatted} (${isHigh ? 'Impacto Alto' : 'Impacto Medio'})`}
        aria-expanded={isOpen}
        onClick={(e) => {
          e.stopPropagation();
          onOpenToggle();
          onEventClick?.(event);
        }}
        className={`group relative flex items-center gap-0.5 sm:gap-1 rounded-full px-1 sm:px-1.5 py-[1px] sm:py-0.5 text-[9px] font-bold font-mono tracking-tight transition-all duration-150 shadow-sm hover:scale-110 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${
          isHigh
            ? 'bg-rose-600/95 text-white border border-rose-300/80 shadow-[0_0_8px_rgba(225,29,72,0.7)] hover:bg-rose-500'
            : 'bg-amber-500/95 text-zinc-950 border border-amber-200/80 shadow-[0_0_6px_rgba(245,158,11,0.7)] hover:bg-amber-400'
        }`}
      >
        {isHigh ? (
          <Flame className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white fill-current animate-pulse flex-shrink-0" />
        ) : (
          <AlertCircle className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-zinc-950 flex-shrink-0" />
        )}
        <span className="leading-none text-[8px] sm:text-[9px] font-mono font-bold tabular-nums">
          {timeOnly}
        </span>
      </button>

      {/* Floating Popover / Tooltip (Desktop only - mobile uses EventDetailModal) */}
      {isOpen && (
        <div
          role="tooltip"
          className={`hidden md:flex absolute ${verticalPositionClass} ${tooltipAlignClass} w-60 sm:w-64 p-3 rounded-xl border border-border-strong bg-popover/95 backdrop-blur-2xl shadow-neon-lg z-50 pointer-events-auto flex-col gap-2 animate-in fade-in zoom-in-95 duration-100`}
        >
          {/* Header with Impact Badge and Market */}
          <div className="flex items-center justify-between gap-2 border-b border-border/80 pb-1.5">
            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider font-mono ${
                isHigh
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}
            >
              {isHigh ? <Flame className="w-2.5 h-2.5" /> : <AlertCircle className="w-2.5 h-2.5" />}
              {isHigh ? 'Impacto Alto' : 'Impacto Medio'}
            </span>
            <span className="text-xs font-mono text-muted-foreground flex items-center gap-1">
              <span>{marketFlag}</span>
              <span className="uppercase">{event.marketId}</span>
            </span>
          </div>

          {/* Event Title and Description */}
          <div>
            <h4 className="text-xs font-bold text-white leading-snug">
              {event.title}
            </h4>
            {event.description && (
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                {event.description}
              </p>
            )}
          </div>

          {/* Times Breakdown */}
          <div className="bg-muted/60 rounded-lg p-1.5 border border-border flex flex-col gap-1 text-[10px] font-mono">
            <div className="flex justify-between items-center text-foreground">
              <span className="text-muted-foreground">🇨🇱 Chile:</span>
              <span className="font-bold text-sky-400 tabular-nums">{event.chileTimeFormatted}</span>
            </div>
            <div className="flex justify-between items-center text-foreground">
              <span className="text-muted-foreground">Local mercado:</span>
              <span className="font-semibold tabular-nums">{event.exchangeTimeFormatted}</span>
            </div>
            {(event.forecast || event.previous) && (
              <div className="flex justify-between items-center pt-1 border-t border-border/50 text-[9px] text-muted-foreground">
                {event.forecast && <span>Prev: <strong className="text-foreground">{event.forecast}</strong></span>}
                {event.previous && <span>Ant: <strong className="text-foreground">{event.previous}</strong></span>}
              </div>
            )}
          </div>

          {/* Action to open drawer */}
          {onSelectEvent && (
            <button
              type="button"
              onClick={() => {
                onSelectEvent(event.marketId);
              }}
              className="flex items-center justify-center gap-1.5 w-full py-1 px-2 rounded-lg bg-white/5 hover:bg-white/10 active:bg-white/15 text-[10px] font-semibold text-sky-300 border border-sky-400/30 transition-colors"
            >
              <span>Ver en panel de eventos</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
});

TimelineEventMarker.displayName = 'TimelineEventMarker';
