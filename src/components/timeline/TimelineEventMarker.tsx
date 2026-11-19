import React from 'react';
import { TimelineEventMarkerData } from '../../core/types';
import { Flame, AlertCircle } from 'lucide-react';

interface TimelineEventMarkerProps {
  event: TimelineEventMarkerData;
  marketFlag: string;
  isTopRow?: boolean;
  isHovered: boolean;
  onHoverChange: (isHovered: boolean) => void;
  onEventClick?: (event: TimelineEventMarkerData) => void;
}

export const TimelineEventMarker: React.FC<TimelineEventMarkerProps> = React.memo(({
  event,
  marketFlag,
  isTopRow = false,
  isHovered,
  onHoverChange,
  onEventClick
}) => {
  const isHigh = event.importance === 'high';
  const timeOnly = event.chileTimeFormatted.split(' ')[0];

  let tooltipAlignClass = 'left-1/2 -translate-x-1/2';
  if (event.leftPercent < 18) {
    tooltipAlignClass = 'left-0 translate-x-0';
  } else if (event.leftPercent > 82) {
    tooltipAlignClass = 'right-0 translate-x-0';
  }

  const verticalPositionClass = isTopRow ? 'top-full mt-2' : 'bottom-full mb-2';

  return (
    <div
      data-timeline-marker="true"
      className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-auto ${
        isHovered ? 'z-50' : 'z-20 hover:z-40'
      }`}
      style={{ left: `${event.leftPercent}%` }}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
    >
      <button
        type="button"
        aria-label={`${event.title} — ${event.chileTimeFormatted} (${isHigh ? 'Impacto alto' : 'Impacto medio'}). Haz clic para ver detalle`}
        onFocus={() => onHoverChange(true)}
        onBlur={() => onHoverChange(false)}
        onClick={(e) => {
          e.stopPropagation();
          onHoverChange(false);
          onEventClick?.(event);
        }}
        className={`group relative flex items-center gap-0.5 sm:gap-1 rounded px-1.5 py-0.5 text-[9px] font-bold font-mono tracking-tight transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-white cursor-pointer before:absolute before:-inset-y-2.5 before:-inset-x-1.5 before:content-[''] ${
          isHigh
            ? 'bg-rose-600 text-white border border-rose-400/50 hover:bg-rose-500'
            : 'bg-amber-500 text-zinc-950 border border-amber-300/60 hover:bg-amber-400'
        }`}
      >
        {isHigh ? (
          <Flame className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white fill-current flex-shrink-0" aria-hidden="true" />
        ) : (
          <AlertCircle className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-zinc-950 flex-shrink-0" aria-hidden="true" />
        )}
        <span className="leading-none text-[8px] sm:text-[9px] font-mono font-bold tabular-nums">
          {timeOnly}
        </span>
      </button>

      {/* Pure informational desktop preview — clicking the pin opens EventDetailModal directly */}
      {isHovered && (
        <div
          role="tooltip"
          className={`hidden md:flex absolute ${verticalPositionClass} ${tooltipAlignClass} w-60 p-3 rounded-xl border border-border-strong bg-popover shadow-neon-lg z-50 pointer-events-none flex-col gap-2`}
        >
          <div className="flex items-center justify-between gap-2 border-b border-border pb-1.5">
            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                isHigh
                  ? 'bg-rose-500/15 text-rose-300 border border-rose-500/35'
                  : 'bg-amber-500/15 text-amber-300 border border-amber-500/35'
              }`}
            >
              {isHigh ? <Flame className="w-2.5 h-2.5" aria-hidden="true" /> : <AlertCircle className="w-2.5 h-2.5" aria-hidden="true" />}
              {isHigh ? 'Impacto alto' : 'Impacto medio'}
            </span>
            <span className="text-xs font-mono text-muted-foreground flex items-center gap-1">
              <span>{marketFlag}</span>
              <span className="uppercase">{event.marketId}</span>
            </span>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white leading-snug">{event.title}</h4>
            {event.description && (
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                {event.description}
              </p>
            )}
          </div>

          <div className="bg-muted/60 rounded-lg p-1.5 border border-border flex flex-col gap-1 text-[10px] font-mono">
            <div className="flex justify-between items-center text-foreground">
              <span className="text-muted-foreground">Hora Chile:</span>
              <span className="font-bold text-sky-400 tabular-nums">{event.chileTimeFormatted}</span>
            </div>
            <div className="flex justify-between items-center text-foreground">
              <span className="text-muted-foreground">Hora local:</span>
              <span className="font-semibold tabular-nums">{event.exchangeTimeFormatted}</span>
            </div>
            {(event.forecast || event.previous) && (
              <div className="flex justify-between items-center pt-1 border-t border-border/50 text-[10px] text-muted-foreground">
                {event.forecast && <span>Pronóstico: <strong className="text-foreground">{event.forecast}</strong></span>}
                {event.previous && <span>Anterior: <strong className="text-foreground">{event.previous}</strong></span>}
              </div>
            )}
          </div>

          <span className="text-[10px] text-sky-300/90 text-center font-medium">
            Haz clic para ver el detalle completo
          </span>
        </div>
      )}
    </div>
  );
});

TimelineEventMarker.displayName = 'TimelineEventMarker';
