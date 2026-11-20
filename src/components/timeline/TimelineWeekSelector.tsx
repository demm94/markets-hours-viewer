import React, { useRef, useEffect, useState } from 'react';
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
  const activeItemRef = useRef<HTMLButtonElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollFades = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  // Wheel horizontal translation for desktop mouse wheel
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    updateScrollFades();

    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && el.scrollWidth > el.clientWidth) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    el.addEventListener('scroll', updateScrollFades, { passive: true });
    window.addEventListener('resize', updateScrollFades);
    return () => {
      el.removeEventListener('wheel', handleWheel);
      el.removeEventListener('scroll', updateScrollFades);
      window.removeEventListener('resize', updateScrollFades);
    };
  }, [days.length]);

  // Scroll active item into view when selectedIsoDate changes
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
    <div className="flex items-center gap-2 w-full">
      <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-muted-foreground whitespace-nowrap shrink-0">
        <Calendar size={13} className="text-zinc-400" aria-hidden="true" />
        <span className="font-medium text-zinc-400">Día:</span>
      </div>

      <div className="relative flex-1 min-w-0">
        {canScrollLeft && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 w-6 z-10 bg-gradient-to-r from-[#0b0e16] to-transparent"
          />
        )}
        {canScrollRight && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 w-6 z-10 bg-gradient-to-l from-[#0b0e16] to-transparent"
          />
        )}

        <div
          ref={scrollRef}
          role="group"
          aria-label="Selector de día para la línea de tiempo"
          className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto select-none py-0.5 px-0.5 w-full [scrollbar-width:none] [&::-webkit-scrollbar]:hidden touch-pan-x"
        >
          {days.map((day) => {
            const isSelected = day.isoDate === selectedIsoDate;
            const eventSummary = day.hasEvents
              ? ` — ${day.eventCount} evento${day.eventCount > 1 ? 's' : ''}${day.hasHighImpact ? ' (impacto alto)' : ''}`
              : '';
            const dayDescriptor =
              day.isToday || day.label === 'Mañana'
                ? `${day.label}, ${day.dayOfWeekShort} ${day.dayOfMonth}`
                : day.label;

            return (
              <button
                key={day.isoDate}
                ref={isSelected ? (el) => { activeItemRef.current = el; } : undefined}
                type="button"
                aria-pressed={isSelected}
                aria-label={`${dayDescriptor}${eventSummary}`}
                onClick={() => onSelectDay(day)}
                className={`group relative flex items-center gap-1 sm:gap-1.5 min-h-[34px] sm:min-h-[40px] px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-lg border text-[11px] sm:text-xs font-medium transition-colors duration-150 cursor-pointer whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
                  isSelected
                    ? 'border-sky-500/45 bg-sky-500/12 text-zinc-50 font-semibold'
                    : day.isToday
                    ? 'border-emerald-500/30 bg-emerald-500/[0.06] text-emerald-200 hover:bg-emerald-500/12'
                    : 'border-border bg-muted/40 text-muted-foreground hover:text-zinc-200 hover:bg-muted/80 hover:border-border-strong'
                }`}
                title={`${dayDescriptor}${eventSummary}`}
              >
                <span>{day.label}</span>

                {day.hasEvents && (
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-mono text-[10px] font-bold leading-none tabular-nums border shrink-0 ${
                      day.hasHighImpact
                        ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                        : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                    }`}
                    aria-hidden="true"
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        day.hasHighImpact ? 'bg-rose-400' : 'bg-amber-400'
                      }`}
                    />
                    <span>{day.eventCount}</span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
});

TimelineWeekSelector.displayName = 'TimelineWeekSelector';
