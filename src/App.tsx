import React, { useMemo } from 'react';
import { MARKETS, CHILE_CONFIG } from './core/markets';
import {
  projectMarketToTimeline,
  evaluateMarketAt,
  minuteOffsetToDateTime,
  formatMinutes,
  isWeekend,
  getSantiagoOffsetDescription
} from './core/timezone';
import { MarketEvaluation, TimelineEventMarkerData, RollingDayInfo } from './core/types';
import { useCurrentTime } from './hooks/useCurrentTime';
import { useScrubber } from './hooks/useScrubber';
import { usePullToRefresh } from './hooks/usePullToRefresh';
import { Header } from './components/Header';
import { MarketCards } from './components/MarketCards';
import { TradingWindowsRadar } from './components/trading-windows/TradingWindowsRadar';
import { EventsDrawer } from './components/EventsDrawer';
import { EventDetailModal } from './components/timeline/EventDetailModal';
import { hasHighImpactEventsToday, getEventsForChileDay, getRollingDaysWindow } from './core/events';
import { getMarketHoliday } from './core/holidays';
import { RotateCw } from 'lucide-react';

export const App: React.FC = () => {
  const { now, currentMinutes, timeFormatted, dateFormatted, minuteKey } = useCurrentTime();

  const [isEventsDrawerOpen, setIsEventsDrawerOpen] = React.useState(false);
  const [selectedEventMarket, setSelectedEventMarket] = React.useState('all');
  const [selectedEventForModal, setSelectedEventForModal] = React.useState<TimelineEventMarkerData | null>(null);

  const handleOpenEvents = React.useCallback((marketId: string = 'all') => {
    setSelectedEventMarket(marketId);
    setIsEventsDrawerOpen(true);
  }, []);

  const handleCloseEvents = React.useCallback(() => {
    setIsEventsDrawerOpen(false);
  }, []);

  const handleCloseEventModal = React.useCallback(() => {
    setSelectedEventForModal(null);
  }, []);

  const handleRefresh = React.useCallback(() => {
    window.location.reload();
  }, []);

  const { pullDistance, isRefreshing, isTriggered } = usePullToRefresh({
    onRefresh: handleRefresh
  });

  const {
    scrubberMinutes,
    isHovering,
    isDragging,
    containerRef,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    handlePointerLeave,
    handleKeyDown
  } = useScrubber(currentMinutes);

  const referenceDayKey = `${now.year}-${now.month}-${now.day}`;

  const rollingDays = useMemo(() => {
    return getRollingDaysWindow(now, 7);
  }, [referenceDayKey, now]);

  const [selectedDayIso, setSelectedDayIso] = React.useState<string>(() => {
    return now.toFormat('yyyy-MM-dd');
  });

  const activeDay = useMemo(() => {
    return rollingDays.find((d) => d.isoDate === selectedDayIso) ?? rollingDays[0];
  }, [rollingDays, selectedDayIso]);

  const handleSelectDay = React.useCallback((day: RollingDayInfo) => {
    setSelectedDayIso(day.isoDate);
  }, []);

  const isViewingToday = activeDay.isToday;
  const activeDate = activeDay.date;
  const activeDayKey = activeDay.isoDate;

  // Precompute 24h timeline segments for each market against selected activeDate
  const marketSegments = useMemo(() => {
    const map: Record<string, ReturnType<typeof projectMarketToTimeline>> = {};
    for (const m of MARKETS) {
      map[m.id] = projectMarketToTimeline(m, activeDate);
    }
    return map;
  }, [activeDayKey]);

  // Real-time evaluation at minute resolution (stable reference within the same minute)
  const evaluationsNow = useMemo(() => {
    const map: Record<string, MarketEvaluation> = {};
    for (const m of MARKETS) {
      map[m.id] = evaluateMarketAt(m, now);
    }
    return map;
  }, [minuteKey]);

  // Scrubber evaluation at selected minute offset against activeDate
  const scrubberInstant = useMemo(() => {
    return minuteOffsetToDateTime(scrubberMinutes, activeDate);
  }, [scrubberMinutes, activeDayKey]);

  const evaluationsScrubber = useMemo(() => {
    const map: Record<string, MarketEvaluation> = {};
    for (const m of MARKETS) {
      const localTime = scrubberInstant.setZone(m.timezone);
      const isWeekendDay = isWeekend(localTime);
      // Only simulate scheduled sessions on weekends; preserve holiday detection on weekdays
      map[m.id] = evaluateMarketAt(m, scrubberInstant, { isSimulation: isWeekendDay });
    }
    return map;
  }, [scrubberInstant]);

  const chileScrubberEvaluation: MarketEvaluation = useMemo(() => {
    const holiday = getMarketHoliday('chile', scrubberInstant.toISODate()!);
    return {
      marketId: 'chile',
      status: 'closed',
      localTimeFormatted: formatMinutes(scrubberMinutes),
      localDateFormatted: scrubberInstant.toFormat("ccc d MMM", { locale: 'es' }),
      ...(holiday ? { holiday, activeSegmentLabel: `Feriado: ${holiday.name}` } : {})
    };
  }, [scrubberMinutes, scrubberInstant]);

  const openMarketsCount = useMemo(
    () => Object.values(evaluationsNow).filter((ev) => ev.status === 'open').length,
    [evaluationsNow]
  );

  const isScrubbing = isHovering || isDragging || Math.abs(scrubberMinutes - currentMinutes) > 2;

  const catalystsMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (const m of MARKETS) {
      map[m.id] = hasHighImpactEventsToday(m.id, now);
    }
    return map;
  }, [referenceDayKey, now]);

  const dailyEvents = useMemo(() => {
    return getEventsForChileDay(activeDate);
  }, [activeDayKey]);

  const hasUpcomingCatalysts = useMemo(() => {
    return Object.values(catalystsMap).some(Boolean);
  }, [catalystsMap]);

  return (
    <div className="min-h-screen min-h-[100dvh] bg-background text-foreground safe-area-container px-2.5 py-2 sm:px-5 sm:py-4 md:px-8 md:py-5 lg:px-10 overflow-x-hidden neon-grid">
      {/* Native-style Pull to Refresh indicator */}
      <div
        className="fixed top-3 left-0 right-0 flex justify-center items-center z-[1000] pointer-events-none transition-opacity duration-200"
        style={{
          transform: `translateY(${Math.max(0, pullDistance - 45)}px)`,
          opacity: pullDistance > 10 ? Math.min((pullDistance - 10) / 40, 1) : 0
        }}
      >
        <div className="inline-flex items-center gap-2 bg-card backdrop-blur-xl border border-border-strong shadow-neon px-3.5 py-1.5 rounded-full text-foreground font-mono text-xs font-bold">
          <RotateCw
            size={14}
            className={`text-neon-sky transition-transform duration-75 ${isRefreshing ? 'animate-spin !text-emerald-400' : ''}`}
            style={{
              transform: isRefreshing ? undefined : `rotate(${pullDistance * 5}deg)`
            }}
          />
          <span className="tracking-wide">
            {isRefreshing
              ? 'Actualizando...'
              : isTriggered
              ? 'Soltá para actualizar'
              : 'Deslizá para actualizar'}
          </span>
        </div>
      </div>

      <div
        className="max-w-[1480px] w-full mx-auto flex flex-col gap-2.5 sm:gap-4 md:gap-6 overflow-x-hidden"
        style={{
          transform: pullDistance > 0 ? `translateY(${pullDistance * 0.55}px)` : undefined,
          transition: pullDistance === 0 ? 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)' : 'none'
        }}
      >
        <Header
          now={now}
          timeFormatted={timeFormatted}
          dateFormatted={dateFormatted}
          openMarketsCount={openMarketsCount}
          totalMarketsCount={MARKETS.length}
          onOpenEvents={() => handleOpenEvents('all')}
          hasUpcomingCatalysts={hasUpcomingCatalysts}
        />

        <main className="flex flex-col gap-2.5 sm:gap-4 md:gap-6">
          <MarketCards
            markets={MARKETS}
            evaluations={evaluationsNow}
            onSelectMarketEvents={handleOpenEvents}
            catalystsMap={catalystsMap}
          />

          <TradingWindowsRadar
            markets={MARKETS}
            marketSegments={marketSegments}
            scrubberEvaluations={!isViewingToday || isScrubbing ? evaluationsScrubber : evaluationsNow}
            chileScrubberEvaluation={chileScrubberEvaluation}
            scrubberMinutes={scrubberMinutes}
            currentMinutes={currentMinutes}
            isHovering={isScrubbing}
            containerRef={containerRef}
            dailyEvents={dailyEvents}
            onSelectEvent={handleOpenEvents}
            onEventClick={setSelectedEventForModal}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            onPointerLeave={handlePointerLeave}
            onKeyDown={handleKeyDown}
            rollingDays={rollingDays}
            selectedIsoDate={activeDay.isoDate}
            onSelectDay={handleSelectDay}
            isToday={isViewingToday}
          />
        </main>

        <footer className="border-t border-border neon-edge pt-3 pb-4 mt-2 md:pt-8 md:pb-8 md:mt-4">
          <div className="flex justify-between items-center flex-wrap gap-2 md:gap-6 text-[11px] sm:text-xs text-muted-foreground">
            <div className="max-w-2xl leading-relaxed">
              <strong className="text-foreground">Zonas Horarias Dinámicas IANA:</strong> Cálculos recalculados en vivo para evitar offsets estáticos. Huso horario de referencia: Chile en {getSantiagoOffsetDescription(now)}.
            </div>
            <div className="font-mono font-semibold text-foreground/80">
              PWA instalable · Motor IANA en tiempo real · {CHILE_CONFIG.country}
            </div>
          </div>
        </footer>
      </div>

      <EventsDrawer
        isOpen={isEventsDrawerOpen}
        onClose={handleCloseEvents}
        selectedMarketId={selectedEventMarket}
        onSelectMarketId={setSelectedEventMarket}
        chileNow={now}
      />

      <EventDetailModal
        event={selectedEventForModal}
        onClose={handleCloseEventModal}
        onOpenMarketDrawer={handleOpenEvents}
      />
    </div>
  );
};

export default App;
