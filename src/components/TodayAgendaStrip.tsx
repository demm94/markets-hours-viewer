import React from 'react';
import { AlertCircle, Calendar, ChevronRight, Clock, Flame } from 'lucide-react';
import { TimelineEventMarkerData, TodayAgendaSummary } from '../core/types';
import { CHILE_CONFIG, MARKETS } from '../core/markets';
import { formatMinutes } from '../core/timezone';

export interface TodayAgendaStripProps {
  agenda: TodayAgendaSummary;
  onEventClick: (event: TimelineEventMarkerData) => void;
  onOpenDrawer: (marketId?: string) => void;
}

const MAX_VISIBLE_EVENTS = 4;

const MARKET_LOOKUP: Record<string, { flag: string; name: string }> = {
  [CHILE_CONFIG.id]: { flag: CHILE_CONFIG.flag, name: CHILE_CONFIG.country },
  ...Object.fromEntries(MARKETS.map((m) => [m.id, { flag: m.flag, name: m.name }]))
};

function getEventClockLabel(event: TimelineEventMarkerData): string {
  if (Number.isFinite(event.minuteInChile)) {
    return `${formatMinutes(event.minuteInChile)} CL`;
  }
  const timePart = event.chileTimeFormatted.split(' ')[0];
  return timePart ? `${timePart} CL` : event.chileTimeFormatted;
}

export const TodayAgendaStrip: React.FC<TodayAgendaStripProps> = React.memo(({
  agenda,
  onEventClick,
  onOpenDrawer
}) => {
  if (!agenda.hasItems) {
    return null;
  }

  const visibleEvents = agenda.events.slice(0, MAX_VISIBLE_EVENTS);
  const remainingEventsCount = Math.max(0, agenda.events.length - MAX_VISIBLE_EVENTS);

  return (
    <section
      aria-label="Hoy en agenda"
      className="rounded-xl border border-border bg-card backdrop-blur-md shadow-neon px-3 py-2.5 sm:px-4 sm:py-3 flex flex-col gap-2"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <Calendar className="w-3.5 h-3.5 text-neon-sky shrink-0" aria-hidden="true" />
          <h2 className="text-xs font-semibold tracking-wide text-zinc-100 whitespace-nowrap">
            Hoy en agenda
          </h2>
          {agenda.highImpactCount > 0 && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-500/15 border border-rose-500/30 text-[11px] font-medium text-rose-300 whitespace-nowrap">
              <Flame className="w-3 h-3 text-rose-400 shrink-0" aria-hidden="true" />
              <span>{agenda.highImpactCount} de impacto alto</span>
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => onOpenDrawer('all')}
          className="inline-flex items-center gap-1 min-h-[36px] px-2.5 py-1 rounded-lg text-xs font-medium text-neon-sky hover:text-sky-300 hover:bg-white/[0.04] transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <span>Ver agenda</span>
          <ChevronRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {agenda.holidays.map((item) => (
          <button
            key={`holiday-${item.marketId}-${item.holiday.date}`}
            type="button"
            onClick={() => onOpenDrawer(item.marketId)}
            title={`Feriado en ${item.marketName}: ${item.holiday.name}`}
            className="inline-flex items-center gap-1.5 min-h-[36px] max-w-full px-2.5 py-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 hover:bg-violet-500/15 text-xs text-violet-200 transition-colors cursor-pointer text-left"
          >
            <span className="shrink-0" aria-hidden="true">{item.flag}</span>
            <span className="font-semibold text-violet-300 shrink-0">Feriado</span>
            <span className="text-violet-200/90 truncate">
              {item.marketName} · {item.holiday.name}
            </span>
          </button>
        ))}

        {agenda.earlyCloses.map((item) => (
          <button
            key={`early-${item.marketId}-${item.holiday.date}`}
            type="button"
            onClick={() => onOpenDrawer(item.marketId)}
            title={`Cierre temprano en ${item.marketName}: ${item.holiday.name}${
              item.holiday.closeTime ? ` (${item.holiday.closeTime} local)` : ''
            }`}
            className="inline-flex items-center gap-1.5 min-h-[36px] max-w-full px-2.5 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/15 text-xs text-amber-200 transition-colors cursor-pointer text-left"
          >
            <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" aria-hidden="true" />
            <span className="shrink-0" aria-hidden="true">{item.flag}</span>
            <span className="font-semibold text-amber-300 shrink-0">Cierre temprano</span>
            <span className="text-amber-200/90 truncate">
              {item.marketName} · {item.holiday.name}
            </span>
          </button>
        ))}

        {visibleEvents.map((evt) => {
          const isHigh = evt.importance === 'high';
          const marketInfo = MARKET_LOOKUP[evt.marketId] ?? {
            flag: '🌐',
            name: evt.marketId.toUpperCase()
          };
          const timeLabel = getEventClockLabel(evt);

          return (
            <button
              key={evt.id}
              type="button"
              onClick={() => onEventClick(evt)}
              title={`${timeLabel} · ${marketInfo.name}: ${evt.title}`}
              className={`inline-flex items-center gap-1.5 min-h-[36px] max-w-full px-2.5 py-1.5 rounded-lg border text-xs transition-colors cursor-pointer text-left ${
                isHigh
                  ? 'border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/15 text-zinc-100'
                  : 'border-amber-500/25 bg-amber-500/10 hover:bg-amber-500/15 text-zinc-100'
              }`}
            >
              {isHigh ? (
                <Flame className="w-3.5 h-3.5 text-rose-400 shrink-0" aria-hidden="true" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" aria-hidden="true" />
              )}
              <span
                className={`font-mono text-[11px] font-semibold tabular-nums shrink-0 ${
                  isHigh ? 'text-rose-300' : 'text-amber-300'
                }`}
              >
                {timeLabel}
              </span>
              <span className="shrink-0" aria-hidden="true">{marketInfo.flag}</span>
              <span className="truncate">{evt.title}</span>
            </button>
          );
        })}

        {remainingEventsCount > 0 && (
          <button
            type="button"
            onClick={() => onOpenDrawer('all')}
            className="inline-flex items-center min-h-[36px] px-2.5 py-1.5 rounded-lg border border-border bg-white/[0.03] hover:border-border-strong hover:bg-white/[0.06] text-xs font-medium text-zinc-200 transition-colors cursor-pointer whitespace-nowrap"
          >
            +{remainingEventsCount} más
          </button>
        )}
      </div>
    </section>
  );
});

TodayAgendaStrip.displayName = 'TodayAgendaStrip';
