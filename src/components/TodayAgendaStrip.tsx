import React from 'react';
import { DateTime } from 'luxon';
import { AlertCircle, Calendar, ChevronRight, Clock, Flame } from 'lucide-react';
import {
  AgendaOpenOptions,
  TimelineEventMarkerData,
  TodayAgendaSummary,
  UnifiedAgendaItem,
  UnifiedEventAgendaItem
} from '../core/types';
import { CHILE_CONFIG, MARKETS } from '../core/markets';
import { CHILE_TZ, formatMinutes } from '../core/timezone';
import { toTimelineEventMarkerData } from '../core/agenda';

export interface TodayAgendaStripProps {
  agenda: TodayAgendaSummary;
  upcomingWeekItems?: UnifiedAgendaItem[];
  nextUpcomingItem?: UnifiedAgendaItem;
  onEventClick: (event: TimelineEventMarkerData) => void;
  onOpenDrawer: (options?: AgendaOpenOptions) => void;
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

function formatShortDayTag(isoDate: string): string {
  const dt = DateTime.fromISO(isoDate, { zone: CHILE_TZ });
  if (!dt.isValid) return isoDate;
  const rawDay = dt.toFormat('ccc', { locale: 'es' }).replace(/\./g, '');
  const dayCap = rawDay.charAt(0).toUpperCase() + rawDay.slice(1);
  return `${dayCap} ${dt.day}`;
}

function getPreviewEventTime(item: UnifiedEventAgendaItem): string {
  return `${formatMinutes(item.minuteInChile)} CL`;
}

export const TodayAgendaStrip: React.FC<TodayAgendaStripProps> = React.memo(({
  agenda,
  upcomingWeekItems = [],
  nextUpcomingItem,
  onEventClick,
  onOpenDrawer
}) => {
  const renderQuickRangeButtons = (showWeekCount: boolean) => (
    <div className="flex items-center gap-1 shrink-0">
      <button
        type="button"
        onClick={() => onOpenDrawer({ range: 'week', kind: 'all', marketId: 'all' })}
        className="inline-flex items-center gap-1 min-h-[34px] px-2 sm:px-2.5 py-1 rounded-lg border border-border/80 bg-white/[0.03] hover:bg-white/[0.07] text-xs font-medium text-neon-sky hover:text-sky-300 transition-colors cursor-pointer whitespace-nowrap"
      >
        <span>Semana</span>
        {showWeekCount && upcomingWeekItems.length > 0 && (
          <span className="px-1 py-0.5 rounded bg-sky-500/15 text-[10px] font-mono font-semibold text-sky-300 tabular-nums leading-none">
            {upcomingWeekItems.length}
          </span>
        )}
      </button>
      <button
        type="button"
        onClick={() => onOpenDrawer({ range: 'month', kind: 'all', marketId: 'all' })}
        className="inline-flex items-center gap-0.5 min-h-[34px] px-2 sm:px-2.5 py-1 rounded-lg border border-border/80 bg-white/[0.03] hover:bg-white/[0.07] text-xs font-medium text-zinc-200 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
      >
        <span>Mes</span>
        <ChevronRight className="w-3.5 h-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
      </button>
    </div>
  );

  // State 1: Today has holidays, early closes, or macro events
  if (agenda.hasItems) {
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

          {renderQuickRangeButtons(true)}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {agenda.holidays.map((item) => (
            <button
              key={`holiday-${item.marketId}-${item.holiday.date}`}
              type="button"
              onClick={() =>
                onOpenDrawer({
                  marketId: item.marketId,
                  kind: 'holidays',
                  range: 'week',
                  focusIsoDate: item.holiday.date
                })
              }
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
              onClick={() =>
                onOpenDrawer({
                  marketId: item.marketId,
                  kind: 'holidays',
                  range: 'week',
                  focusIsoDate: item.holiday.date
                })
              }
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
              onClick={() => onOpenDrawer({ range: 'week', kind: 'all', marketId: 'all' })}
              className="inline-flex items-center min-h-[36px] px-2.5 py-1.5 rounded-lg border border-border bg-white/[0.03] hover:border-border-strong hover:bg-white/[0.06] text-xs font-medium text-zinc-200 transition-colors cursor-pointer whitespace-nowrap"
            >
              +{remainingEventsCount} más
            </button>
          )}
        </div>
      </section>
    );
  }

  // State 2: Today is quiet, but the rest of the 7-day window has upcoming events or holidays
  if (upcomingWeekItems.length > 0) {
    const visibleWeekItems = upcomingWeekItems.slice(0, MAX_VISIBLE_EVENTS);
    const remainingWeekCount = Math.max(0, upcomingWeekItems.length - MAX_VISIBLE_EVENTS);

    return (
      <section
        aria-label="Próximos 7 días"
        className="rounded-xl border border-border bg-card backdrop-blur-md shadow-neon px-3 py-2.5 sm:px-4 sm:py-3 flex flex-col gap-2"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <Calendar className="w-3.5 h-3.5 text-neon-sky shrink-0" aria-hidden="true" />
            <h2 className="text-xs font-semibold tracking-wide text-zinc-100 whitespace-nowrap">
              Próximos 7 días
            </h2>
            <span className="px-1.5 py-0.5 rounded bg-white/[0.05] border border-border text-[11px] font-mono font-medium text-zinc-300 tabular-nums">
              {upcomingWeekItems.length}
            </span>
          </div>

          {renderQuickRangeButtons(false)}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {visibleWeekItems.map((item) => {
            const shortDay = formatShortDayTag(item.isoDate);

            if (item.kind === 'holiday') {
              const isEarly = item.isEarlyClose;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    onOpenDrawer({
                      marketId: item.marketId,
                      kind: 'holidays',
                      range: 'week',
                      focusIsoDate: item.isoDate
                    })
                  }
                  title={`${shortDay} · ${item.marketName}: ${item.holiday.name}`}
                  className={`inline-flex items-center gap-1.5 min-h-[36px] max-w-full px-2.5 py-1.5 rounded-lg border text-xs transition-colors cursor-pointer text-left ${
                    isEarly
                      ? 'border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/15 text-amber-200'
                      : 'border-violet-500/30 bg-violet-500/10 hover:bg-violet-500/15 text-violet-200'
                  }`}
                >
                  <span className="font-mono text-[11px] font-semibold text-zinc-200 shrink-0">
                    {shortDay}
                  </span>
                  <span className="shrink-0" aria-hidden="true">{item.marketFlag}</span>
                  <span className={`font-semibold shrink-0 ${isEarly ? 'text-amber-300' : 'text-violet-300'}`}>
                    {isEarly ? 'Cierre temprano' : 'Feriado'}
                  </span>
                  <span className="truncate opacity-90">{item.holiday.name}</span>
                </button>
              );
            }

            const isHigh = item.event.importance === 'high';
            const timeLabel = getPreviewEventTime(item);

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onEventClick(toTimelineEventMarkerData(item))}
                title={`${shortDay} ${timeLabel} · ${item.marketName}: ${item.event.title}`}
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
                <span className="font-mono text-[11px] font-semibold text-zinc-300 shrink-0">
                  {shortDay}
                </span>
                <span
                  className={`font-mono text-[11px] font-semibold tabular-nums shrink-0 ${
                    isHigh ? 'text-rose-300' : 'text-amber-300'
                  }`}
                >
                  {timeLabel}
                </span>
                <span className="shrink-0" aria-hidden="true">{item.marketFlag}</span>
                <span className="truncate">{item.event.title}</span>
              </button>
            );
          })}

          {remainingWeekCount > 0 && (
            <button
              type="button"
              onClick={() => onOpenDrawer({ range: 'week', kind: 'all', marketId: 'all' })}
              className="inline-flex items-center min-h-[36px] px-2.5 py-1.5 rounded-lg border border-border bg-white/[0.03] hover:border-border-strong hover:bg-white/[0.06] text-xs font-medium text-zinc-200 transition-colors cursor-pointer whitespace-nowrap"
            >
              +{remainingWeekCount} más
            </button>
          )}
        </div>
      </section>
    );
  }

  // State 3: Quiet week — compact 1-line bar with nearest future hint and 1-tap Month trigger
  const nextLabel = nextUpcomingItem
    ? `${formatShortDayTag(nextUpcomingItem.isoDate)} ${nextUpcomingItem.marketFlag} ${
        nextUpcomingItem.kind === 'holiday'
          ? nextUpcomingItem.holiday.name
          : nextUpcomingItem.event.title
      }`
    : null;

  return (
    <section
      aria-label="Resumen semanal de agenda"
      className="rounded-xl border border-border bg-card backdrop-blur-md shadow-neon px-3 py-2 sm:px-4 sm:py-2.5 flex flex-wrap items-center justify-between gap-2"
    >
      <div className="flex items-center gap-2 min-w-0 flex-wrap text-xs">
        <Calendar className="w-3.5 h-3.5 text-zinc-400 shrink-0" aria-hidden="true" />
        <span className="font-medium text-zinc-300">Agenda tranquila esta semana</span>
        {nextLabel && (
          <span className="text-muted-foreground truncate">
            · Próximo: <span className="text-zinc-200 font-medium">{nextLabel}</span>
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={() => onOpenDrawer({ range: 'month', kind: 'all', marketId: 'all' })}
        className="inline-flex items-center gap-1 min-h-[34px] px-2.5 py-1 rounded-lg border border-border/80 bg-white/[0.03] hover:bg-white/[0.07] text-xs font-medium text-neon-sky hover:text-sky-300 transition-colors cursor-pointer whitespace-nowrap shrink-0"
      >
        <span>Ver mes</span>
        <ChevronRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      </button>
    </section>
  );
});

TodayAgendaStrip.displayName = 'TodayAgendaStrip';
