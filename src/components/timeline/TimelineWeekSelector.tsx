import React, { useRef, useEffect } from 'react';
import { RollingDayInfo } from '../../core/types';
import { Calendar } from 'lucide-react';

export interface TimelineWeekSelectorProps {
  days: RollingDayInfo[];
  selectedIsoDate: string;
  onSelectDay: (day: RollingDayInfo) => void;
}

export const TimelineWeekSelector: React.FC<TimelineWeekSelectorProps> = React.memo(({
  days,
  selectedIsoDate,
  onSelectDay
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Wheel horizontal translation for desktop mouse wheel
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && el.scrollWidth > el.clientWidth) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  // Scroll active item into view when selectedIsoDate changes
  const activeItemRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (activeItemRef.current && scrollRef.current) {
      activeItemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, [selectedIsoDate]);

  return (
    <div className="flex items-center gap-2 w-full pt-1 pb-0.5">
      <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-muted-foreground whitespace-nowrap pl-0.5">
        <Calendar size={13} className="text-sky-400" />
        <span className="font-semibold text-foreground/80">Proyección:</span>
      </div>

      <div
        ref={scrollRef}
        role="tablist"
        aria-label="Selector de día para la línea de tiempo"
        className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto select-none py-0.5 px-0.5 w-full [scrollbar-width:none] [&::-webkit-scrollbar]:hidden touch-pan-x"
      >
        {days.map((day) => {
          const isSelected = day.isoDate === selectedIsoDate;

          return (
            <button
              key={day.isoDate}
              ref={isSelected ? (el) => { activeItemRef.current = el; } : undefined}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => onSelectDay(day)}
              className={`group relative flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl border text-[11px] sm:text-xs font-medium transition-all duration-150 cursor-pointer whitespace-nowrap outline-none focus-visible:ring-1 focus-visible:ring-sky-400 ${
                isSelected
                  ? 'border-sky-400/90 bg-sky-500/20 text-white font-semibold shadow-[0_0_12px_rgba(56,189,248,0.25)] ring-1 ring-sky-400/40'
                  : 'border-border/60 bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted/80 hover:border-border/90'
              }`}
              title={`${day.label}, ${day.dayOfWeekShort} ${day.dayOfMonth} (${day.isoDate})${
                day.hasEvents ? ` — ${day.eventCount} catalizador(es)` : ''
              }`}
            >
              {/* Day Label & Number */}
              <div className="flex items-center gap-1">
                <span>{day.label}</span>
                {day.isToday && (
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                )}
              </div>

              {/* Event Catalyst Dot */}
              {day.hasEvents && (
                <span
                  className={`inline-flex items-center justify-center rounded-full transition-transform ${
                    day.hasHighImpact
                      ? 'w-1.5 h-1.5 bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.9)] animate-pulse'
                      : 'w-1.5 h-1.5 bg-amber-400 shadow-[0_0_5px_rgba(251,191,36,0.9)]'
                  }`}
                  aria-label={`${day.eventCount} eventos${day.hasHighImpact ? ' (alto impacto)' : ''}`}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
});

TimelineWeekSelector.displayName = 'TimelineWeekSelector';
