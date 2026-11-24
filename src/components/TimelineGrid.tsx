import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AlertCircle, Calendar, CalendarOff, Clock, Eye, Flame, RotateCcw, X } from 'lucide-react';
import {
  MarketConfig,
  MarketEvaluation,
  MarketHoliday,
  TimelineSegment,
  TimelineEventMarkerData,
  RollingDayInfo,
  TodayHolidayItem
} from '../core/types';
import { CHILE_CONFIG } from '../core/markets';
import { formatMinutes } from '../core/timezone';
import {
  formatSegmentInspectionText,
  getSelectedDayEventsList,
  getTimelineActivityAtMinute
} from '../core/timeline-schedule';
import { TimelineHeader } from './timeline/TimelineHeader';
import { TimelineLeftColumn } from './timeline/TimelineLeftColumn';
import { TimelineBars, TimelineSegmentRef } from './timeline/TimelineBars';
import { TimelineLegend } from './timeline/TimelineLegend';
import { Button } from './ui/button';

interface TimelineGridProps {
  markets: MarketConfig[];
  marketSegments: Record<string, TimelineSegment[]>;
  liveEvaluations: Record<string, MarketEvaluation>;
  currentMinutes: number;
  dailyEvents?: Record<string, TimelineEventMarkerData[]>;
  selectedDayHolidays?: TodayHolidayItem[];
  chileHoliday?: MarketHoliday;
  onEventClick?: (event: TimelineEventMarkerData) => void;
  onOpenHolidayDrawer?: (marketId: string, isoDate: string) => void;
  rollingDays: RollingDayInfo[];
  selectedIsoDate: string;
  onSelectDay: (day: RollingDayInfo) => void;
  onResetToToday?: () => void;
  isToday?: boolean;
  isWeekendDay?: boolean;
  simulateWeekday?: boolean;
  onToggleSimulateWeekday?: () => void;
  nextReopenLabel?: string;
}

export const TimelineGrid: React.FC<TimelineGridProps> = React.memo(({
  markets,
  marketSegments,
  liveEvaluations,
  currentMinutes,
  dailyEvents,
  selectedDayHolidays = [],
  chileHoliday,
  onEventClick,
  onOpenHolidayDrawer,
  rollingDays,
  selectedIsoDate,
  onSelectDay,
  onResetToToday,
  isToday = true,
  isWeekendDay = false,
  simulateWeekday = false,
  onToggleSimulateWeekday,
  nextReopenLabel
}) => {
  const [hoverMinute, setHoverMinute] = useState<number | null>(null);
  const [hoveredSegment, setHoveredSegment] = useState<TimelineSegmentRef | null>(null);
  const [pinnedSegment, setPinnedSegment] = useState<TimelineSegmentRef | null>(null);

  // Clear ephemeral inspection state when switching day or weekend simulation mode
  useEffect(() => {
    setHoverMinute(null);
    setHoveredSegment(null);
    setPinnedSegment(null);
  }, [selectedIsoDate, simulateWeekday]);

  // Allow dismissing a pinned bar detail with Escape
  useEffect(() => {
    if (!pinnedSegment) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPinnedSegment(null);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [pinnedSegment]);

  const handleTogglePinnedSegment = useCallback((seg: TimelineSegmentRef | null) => {
    if (!seg) {
      setPinnedSegment(null);
      return;
    }
    setPinnedSegment((prev) =>
      prev && prev.marketId === seg.marketId && prev.segmentIndex === seg.segmentIndex ? null : seg
    );
  }, []);

  const hasAnyRealSegment = useMemo(
    () => markets.some((m) => (marketSegments[m.id]?.length ?? 0) > 0),
    [markets, marketSegments]
  );

  const selectedDayEvents = useMemo(
    () => getSelectedDayEventsList(dailyEvents),
    [dailyEvents]
  );

  const selectedDayLabel = useMemo(
    () => rollingDays.find((d) => d.isoDate === selectedIsoDate)?.label ?? 'Hoy',
    [rollingDays, selectedIsoDate]
  );

  const marketLookup = useMemo(
    () => ({
      [CHILE_CONFIG.id]: { flag: CHILE_CONFIG.flag, name: CHILE_CONFIG.country },
      ...Object.fromEntries(markets.map((m) => [m.id, { flag: m.flag, name: m.name }]))
    }),
    [markets]
  );

  const highImpactCount = useMemo(
    () => selectedDayEvents.filter((evt) => evt.importance === 'high').length,
    [selectedDayEvents]
  );

  const activeSegmentRef = hoveredSegment ?? pinnedSegment;
  const activeMarket = activeSegmentRef
    ? markets.find((m) => m.id === activeSegmentRef.marketId)
    : undefined;
  const activeSegment =
    activeSegmentRef && activeMarket
      ? marketSegments[activeMarket.id]?.[activeSegmentRef.segmentIndex]
      : undefined;

  const hourSnapshot = useMemo(
    () =>
      hoverMinute !== null
        ? getTimelineActivityAtMinute(hoverMinute, markets, marketSegments)
        : null,
    [hoverMinute, markets, marketSegments]
  );

  const activeMarketIds = useMemo(
    () => new Set(hourSnapshot?.activeMarketIds ?? []),
    [hourSnapshot]
  );

  const focusedMarketId = activeSegmentRef?.marketId ?? null;
  const hasActiveInspection = Boolean((activeMarket && activeSegment) || hourSnapshot);

  return (
    <section
      aria-label="Línea de tiempo bursátil de 24 horas"
      className="rounded-xl border border-border bg-card backdrop-blur-md shadow-neon p-2.5 sm:p-4 md:p-5 flex flex-col gap-2 sm:gap-3"
    >
      <TimelineHeader
        isToday={isToday}
        onResetToToday={onResetToToday}
        days={rollingDays}
        selectedIsoDate={selectedIsoDate}
        onSelectDay={onSelectDay}
        chileHoliday={chileHoliday}
      />

      {/* Honest Weekend Banner with explicit Weekday Reference Simulation Toggle */}
      {isWeekendDay && onToggleSimulateWeekday && (
        <div
          className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg border text-xs ${
            simulateWeekday
              ? 'border-sky-500/35 bg-sky-500/10 text-sky-100'
              : 'border-border-strong bg-white/[0.03] text-zinc-200'
          }`}
        >
          <div className="flex items-start sm:items-center gap-2 min-w-0">
            <CalendarOff
              size={15}
              className={`shrink-0 mt-0.5 sm:mt-0 ${simulateWeekday ? 'text-sky-400' : 'text-zinc-400'}`}
              aria-hidden="true"
            />
            <span className="leading-snug">
              {simulateWeekday ? (
                <>
                  <strong>Horario habitual de referencia:</strong> mostrando aperturas y cierres de lunes a viernes en hora Chile.
                </>
              ) : hasAnyRealSegment ? (
                <>
                  <strong>Fin de semana:</strong> mercados occidentales cerrados; solo aperturas asiáticas desde la noche (hora Chile).
                </>
              ) : (
                <>
                  <strong>Fin de semana:</strong> {isToday ? 'mercados cerrados hoy.' : 'mercados cerrados este día.'}
                  {nextReopenLabel && (
                    <span className="text-zinc-400"> Próxima apertura: {nextReopenLabel}.</span>
                  )}
                </>
              )}
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onToggleSimulateWeekday}
            aria-pressed={simulateWeekday}
            className="gap-1.5 min-h-[34px] sm:min-h-[38px] px-2.5 sm:px-3 text-xs font-medium shrink-0 self-start sm:self-auto cursor-pointer"
          >
            {simulateWeekday ? (
              <>
                <RotateCcw size={12} aria-hidden="true" />
                <span>Volver a calendario real</span>
              </>
            ) : (
              <>
                <Eye size={13} aria-hidden="true" />
                <span>Ver horario habitual</span>
              </>
            )}
          </Button>
        </div>
      )}

      {/* Unified 24h Table + Zero-CLS Single-Line Inspection Footer */}
      <div className="rounded-xl border border-border bg-muted/40">
        <div className="relative flex w-full select-none">
          <TimelineLeftColumn
            markets={markets}
            marketSegments={marketSegments}
            liveEvaluations={liveEvaluations}
            isToday={isToday}
            simulateWeekday={simulateWeekday}
            activeMarketIds={activeMarketIds}
            focusedMarketId={focusedMarketId}
          />

          <TimelineBars
            markets={markets}
            marketSegments={marketSegments}
            currentMinutes={currentMinutes}
            dailyEvents={dailyEvents}
            onEventClick={onEventClick}
            isToday={isToday}
            isWeekendDay={isWeekendDay}
            simulateWeekday={simulateWeekday}
            hoverMinute={hoverMinute}
            hoveredSegment={hoveredSegment}
            pinnedSegment={pinnedSegment}
            onHoverMinuteChange={setHoverMinute}
            onHoveredSegmentChange={setHoveredSegment}
            onTogglePinnedSegment={handleTogglePinnedSegment}
          />
        </div>

        {/* Fixed-height single-line inspection bar (0px layout shift) */}
        <div
          aria-live="polite"
          className={`h-8 sm:h-9 px-2.5 sm:px-3 border-t flex items-center justify-between gap-2 text-[11px] sm:text-xs transition-colors duration-150 rounded-b-xl ${
            activeMarket && activeSegment
              ? 'border-sky-500/30 bg-sky-500/[0.08] text-zinc-100'
              : hasActiveInspection
              ? 'border-sky-500/25 bg-sky-500/[0.06] text-zinc-100'
              : 'border-border bg-muted/30 text-muted-foreground'
          }`}
        >
          {activeMarket && activeSegment ? (
            <>
              <span className="font-mono font-medium truncate">
                {formatSegmentInspectionText(activeMarket, activeSegment)}
              </span>
              {hourSnapshot ? (
                <span className="font-mono text-[10px] sm:text-[11px] font-semibold text-sky-300 tabular-nums shrink-0">
                  {hourSnapshot.timeLabel}
                </span>
              ) : (
                pinnedSegment &&
                !hoveredSegment && (
                  <button
                    type="button"
                    onClick={() => setPinnedSegment(null)}
                    aria-label="Cerrar detalle de sesión"
                    className="inline-flex items-center justify-center w-6 h-6 rounded-md text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer shrink-0"
                  >
                    <X size={13} aria-hidden="true" />
                  </button>
                )
              )}
            </>
          ) : hourSnapshot ? (
            <div className="flex items-center gap-1.5 min-w-0 w-full truncate">
              <span className="font-mono font-bold text-sky-300 tabular-nums shrink-0">
                {hourSnapshot.timeLabel}
              </span>
              <span className="text-zinc-500 shrink-0" aria-hidden="true">
                ·
              </span>
              {hourSnapshot.openMarkets.length > 0 ||
              hourSnapshot.lunchMarkets.length > 0 ||
              hourSnapshot.preMarketMarkets.length > 0 ? (
                <div className="flex items-center gap-2 min-w-0 truncate">
                  {hourSnapshot.openMarkets.length > 0 && (
                    <span className="inline-flex items-center gap-1 text-emerald-200 truncate">
                      <span className="text-emerald-300 font-medium">Abiertas:</span>
                      <span className="sm:hidden">
                        {hourSnapshot.openMarkets.map((m) => m.flag).join(' ')}
                      </span>
                      <span className="hidden sm:inline truncate">
                        {hourSnapshot.openMarkets.map((m) => `${m.flag} ${m.name}`).join(', ')}
                      </span>
                    </span>
                  )}
                  {hourSnapshot.lunchMarkets.length > 0 && (
                    <span className="inline-flex items-center gap-1 text-amber-200 truncate">
                      <span className="text-amber-300 font-medium">Almuerzo:</span>
                      <span className="sm:hidden">
                        {hourSnapshot.lunchMarkets.map((m) => m.flag).join(' ')}
                      </span>
                      <span className="hidden sm:inline truncate">
                        {hourSnapshot.lunchMarkets.map((m) => `${m.flag} ${m.name}`).join(', ')}
                      </span>
                    </span>
                  )}
                  {hourSnapshot.preMarketMarkets.length > 0 && (
                    <span className="inline-flex items-center gap-1 text-sky-200 truncate">
                      <span className="text-sky-300 font-medium">Pre:</span>
                      <span className="sm:hidden">
                        {hourSnapshot.preMarketMarkets.map((m) => m.flag).join(' ')}
                      </span>
                      <span className="hidden sm:inline truncate">
                        {hourSnapshot.preMarketMarkets.map((m) => `${m.flag} ${m.name}`).join(', ')}
                      </span>
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-zinc-400 truncate">Sin bolsas abiertas</span>
              )}
            </div>
          ) : (
            <>
              <span className="sm:hidden truncate">
                Toca o desliza sobre las barras para inspeccionar
              </span>
              <span className="hidden sm:inline truncate">
                Pasa el cursor o haz clic en una barra para inspeccionar sesiones
              </span>
            </>
          )}
        </div>
      </div>

      {/* Selected-Day Agenda Strip for non-today days (holidays, early closes, and macro events) */}
      {!isToday && (selectedDayHolidays.length > 0 || selectedDayEvents.length > 0 ? (
        <div
          aria-label={`Agenda para ${selectedDayLabel}`}
          className="rounded-lg border border-border bg-white/[0.02] px-2.5 py-1.5 sm:px-3 sm:py-2 flex flex-col gap-1.5 sm:gap-2"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <Calendar className="w-3.5 h-3.5 text-sky-400 shrink-0" aria-hidden="true" />
              <span className="text-[11px] sm:text-xs font-semibold text-zinc-100">
                Agenda · {selectedDayLabel}
              </span>
              {selectedDayHolidays.length > 0 && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-violet-500/15 border border-violet-500/30 text-[10px] sm:text-[11px] font-medium text-violet-300">
                  <span>
                    {selectedDayHolidays.length} {selectedDayHolidays.length === 1 ? 'feriado' : 'feriados'}
                  </span>
                </span>
              )}
              {highImpactCount > 0 && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-500/15 border border-rose-500/30 text-[10px] sm:text-[11px] font-medium text-rose-300">
                  <Flame className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-rose-400 shrink-0" aria-hidden="true" />
                  <span>{highImpactCount} de impacto alto</span>
                </span>
              )}
            </div>
            <span className="hidden sm:inline text-[11px] text-muted-foreground">
              Toca un elemento para ver detalles
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {selectedDayHolidays.map((item) => {
              const isEarly = Boolean(item.holiday.isEarlyClose);
              return (
                <button
                  key={`day-hol-${item.marketId}-${item.holiday.date}`}
                  type="button"
                  onClick={() => onOpenHolidayDrawer?.(item.marketId, item.holiday.date)}
                  title={`${item.marketName}: ${item.holiday.name}${
                    isEarly && item.holiday.closeTime ? ` (${item.holiday.closeTime} local)` : ''
                  }`}
                  className={`inline-flex items-center gap-1.5 min-h-[30px] sm:min-h-[34px] max-w-full px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg border text-[11px] sm:text-xs transition-colors cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
                    isEarly
                      ? 'border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/15 text-amber-200'
                      : 'border-violet-500/30 bg-violet-500/10 hover:bg-violet-500/15 text-violet-200'
                  }`}
                >
                  {isEarly ? (
                    <Clock className="w-3 h-3 text-amber-400 shrink-0" aria-hidden="true" />
                  ) : (
                    <Calendar className="w-3 h-3 text-violet-400 shrink-0" aria-hidden="true" />
                  )}
                  <span className="shrink-0" aria-hidden="true">{item.flag}</span>
                  <span className={`font-semibold shrink-0 ${isEarly ? 'text-amber-300' : 'text-violet-300'}`}>
                    {isEarly ? 'Cierre temprano' : 'Feriado'}
                  </span>
                  <span className="truncate opacity-90">
                    {item.marketName} · {item.holiday.name}
                  </span>
                </button>
              );
            })}

            {selectedDayEvents.map((evt) => {
              const isHigh = evt.importance === 'high';
              const marketInfo = marketLookup[evt.marketId] ?? {
                flag: '🌐',
                name: evt.marketId.toUpperCase()
              };
              const timeLabel = `${formatMinutes(evt.minuteInChile)} CL`;

              return (
                <button
                  key={evt.id}
                  type="button"
                  onClick={() => onEventClick?.(evt)}
                  title={`${timeLabel} · ${marketInfo.name}: ${evt.title}`}
                  className={`inline-flex items-center gap-1.5 min-h-[30px] sm:min-h-[34px] max-w-full px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg border text-[11px] sm:text-xs transition-colors cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
                    isHigh
                      ? 'border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/15 text-zinc-100'
                      : 'border-amber-500/25 bg-amber-500/10 hover:bg-amber-500/15 text-zinc-100'
                  }`}
                >
                  {isHigh ? (
                    <Flame className="w-3 h-3 text-rose-400 shrink-0" aria-hidden="true" />
                  ) : (
                    <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" aria-hidden="true" />
                  )}
                  <span
                    className={`font-mono text-[10px] sm:text-[11px] font-semibold tabular-nums shrink-0 ${
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
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-border/70 bg-white/[0.015] px-2.5 py-1.5 sm:px-3 sm:py-2 text-[11px] sm:text-xs text-muted-foreground flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-zinc-500 shrink-0" aria-hidden="true" />
          <span>Sin eventos ni feriados programados para este día.</span>
        </div>
      ))}

      <TimelineLegend />
    </section>
  );
});

TimelineGrid.displayName = 'TimelineGrid';
