import React, { useMemo } from 'react';
import { MARKETS, CHILE_CONFIG } from './core/markets';
import {
  CHILE_TZ,
  projectMarketToTimeline,
  evaluateMarketAt,
  minuteOffsetToDateTime,
  formatMinutes,
  isWeekend,
  getSantiagoOffsetDescription
} from './core/timezone';
import { getLiveStatusSummary, getTodayAgenda } from './core/market-summary';
import { MarketEvaluation, TimelineEventMarkerData, RollingDayInfo } from './core/types';
import { useCurrentTime } from './hooks/useCurrentTime';
import { useScrubber } from './hooks/useScrubber';
import { useMarketNotifications } from './hooks/useMarketNotifications';
import { Header } from './components/Header';
import { AmbientBackground } from './components/AmbientBackground';
import { LiveStatusBar } from './components/LiveStatusBar';
import { TodayAgendaStrip } from './components/TodayAgendaStrip';
import { TimelineGrid } from './components/TimelineGrid';
import { MarketCards } from './components/MarketCards';
import { EventsDrawer } from './components/EventsDrawer';
import { EventDetailModal } from './components/timeline/EventDetailModal';
import { hasHighImpactEventsToday, getEventsForChileDay, getRollingDaysWindow } from './core/events';
import { getMarketHoliday } from './core/holidays';

export const App: React.FC = () => {
  const { now, currentMinutes, timeFormatted, dateFormatted, minuteKey } = useCurrentTime();

  const [isEventsDrawerOpen, setIsEventsDrawerOpen] = React.useState(false);
  const [selectedEventMarket, setSelectedEventMarket] = React.useState('all');
  const [selectedEventForModal, setSelectedEventForModal] = React.useState<TimelineEventMarkerData | null>(null);
  const [simulateWeekday, setSimulateWeekday] = React.useState(false);

  const handleOpenEvents = React.useCallback((marketId: string = 'all') => {
    setSelectedEventMarket(marketId);
    setIsEventsDrawerOpen(true);
  }, []);

  const handleOpenAllEvents = React.useCallback(() => {
    handleOpenEvents('all');
  }, [handleOpenEvents]);

  const handleCloseEvents = React.useCallback(() => {
    setIsEventsDrawerOpen(false);
  }, []);

  const handleCloseEventModal = React.useCallback(() => {
    setSelectedEventForModal(null);
  }, []);

  const handleToggleSimulateWeekday = React.useCallback(() => {
    setSimulateWeekday((prev) => !prev);
  }, []);

  const {
    scrubberMinutes,
    isHovering,
    isDragging,
    isPinned,
    containerRef,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    handlePointerLeave,
    handleKeyDown,
    resetToNow
  } = useScrubber(currentMinutes);

  const referenceDayKey = `${now.year}-${now.month}-${now.day}`;
  const referenceHourKey = `${referenceDayKey}-${now.hour}`;

  const rollingDays = useMemo(() => {
    return getRollingDaysWindow(now, 7);
  }, [referenceDayKey]);

  const [selectedDayIso, setSelectedDayIso] = React.useState<string>(() => {
    return now.toFormat('yyyy-MM-dd');
  });

  const activeDay = useMemo(() => {
    return rollingDays.find((d) => d.isoDate === selectedDayIso) ?? rollingDays[0];
  }, [rollingDays, selectedDayIso]);

  const handleSelectDay = React.useCallback(
    (day: RollingDayInfo) => {
      setSelectedDayIso(day.isoDate);
      setSimulateWeekday(false);
      resetToNow();
    },
    [resetToNow]
  );

  const handleResetToNow = React.useCallback(() => {
    resetToNow();
    setSelectedDayIso(rollingDays[0].isoDate);
    setSimulateWeekday(false);
  }, [resetToNow, rollingDays]);

  const isViewingToday = activeDay.isToday;
  const activeDate = activeDay.date;
  const activeDayKey = activeDay.isoDate;
  const isSelectedDayWeekend = useMemo(() => isWeekend(activeDate), [activeDayKey]);

  // Precompute 24h timeline segments for each market against selected activeDate
  const marketSegments = useMemo(() => {
    const map: Record<string, ReturnType<typeof projectMarketToTimeline>> = {};
    for (const m of MARKETS) {
      map[m.id] = projectMarketToTimeline(m, activeDate, CHILE_TZ, { isSimulation: simulateWeekday });
    }
    return map;
  }, [activeDayKey, simulateWeekday]);

  // Stable reference at minute resolution for components that do not require 1Hz second ticking
  const chileNowMinute = useMemo(() => {
    return now.startOf('minute');
  }, [minuteKey]);

  const santiagoOffsetDescription = useMemo(() => {
    return getSantiagoOffsetDescription(chileNowMinute);
  }, [chileNowMinute]);

  // Real-time evaluation at minute resolution
  const evaluationsNow = useMemo(() => {
    const map: Record<string, MarketEvaluation> = {};
    for (const m of MARKETS) {
      map[m.id] = evaluateMarketAt(m, chileNowMinute);
    }
    return map;
  }, [chileNowMinute]);

  const liveStatusSummary = useMemo(
    () => getLiveStatusSummary(MARKETS, evaluationsNow),
    [evaluationsNow]
  );

  const todayAgenda = useMemo(
    () => getTodayAgenda(MARKETS, chileNowMinute),
    [referenceHourKey]
  );

  const {
    permission: notificationPermission,
    preferences: notificationPreferences,
    toggleNotifications,
    toggleMarketSubscription
  } = useMarketNotifications(MARKETS, evaluationsNow);

  // Scrubber evaluation at selected minute offset against activeDate (respects explicit simulation toggle)
  const scrubberInstant = useMemo(() => {
    return minuteOffsetToDateTime(scrubberMinutes, activeDate);
  }, [scrubberMinutes, activeDayKey]);

  const evaluationsScrubber = useMemo(() => {
    const map: Record<string, MarketEvaluation> = {};
    for (const m of MARKETS) {
      map[m.id] = evaluateMarketAt(m, scrubberInstant, { isSimulation: simulateWeekday });
    }
    return map;
  }, [scrubberInstant, simulateWeekday]);

  const chileScrubberEvaluation: MarketEvaluation = useMemo(() => {
    const holiday = getMarketHoliday('chile', scrubberInstant.toISODate()!);
    return {
      marketId: 'chile',
      status: 'closed',
      localTimeFormatted: formatMinutes(scrubberMinutes),
      localDateFormatted: scrubberInstant.toFormat('ccc d MMM', { locale: 'es' }),
      ...(holiday ? { holiday, activeSegmentLabel: `Feriado: ${holiday.name}` } : {})
    };
  }, [scrubberMinutes, scrubberInstant]);

  const openMarketsCount = liveStatusSummary.openMarkets.length;
  const isScrubbing = isPinned || isHovering || isDragging || Math.abs(scrubberMinutes - currentMinutes) > 2;

  const catalystsMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (const m of MARKETS) {
      map[m.id] = hasHighImpactEventsToday(m.id, now);
    }
    return map;
  }, [referenceDayKey]);

  const dailyEvents = useMemo(() => {
    return getEventsForChileDay(activeDate);
  }, [activeDayKey]);

  const hasUpcomingCatalysts = useMemo(() => {
    return Object.values(catalystsMap).some(Boolean);
  }, [catalystsMap]);

  const nextReopenLabel = useMemo(() => {
    if (!isSelectedDayWeekend) return undefined;
    const evalInstant = isViewingToday
      ? chileNowMinute
      : activeDate.set({ hour: 12, minute: 0, second: 0, millisecond: 0 });
    let bestBell:
      | { market: (typeof MARKETS)[number]; transition: NonNullable<MarketEvaluation['nextTransition']> }
      | undefined;

    for (const market of MARKETS) {
      const ev = isViewingToday ? evaluationsNow[market.id] : evaluateMarketAt(market, evalInstant);
      const transition = ev?.nextTransition;
      if (!transition || transition.type !== 'open') continue;
      if (!bestBell || transition.inMinutes < bestBell.transition.inMinutes) {
        bestBell = { market, transition };
      }
    }

    if (!bestBell) return undefined;
    const label = bestBell.transition.atChileFormatted ?? bestBell.transition.formattedCountdown;
    return `${bestBell.market.flag} ${bestBell.market.name} (${label})`;
  }, [isSelectedDayWeekend, isViewingToday, chileNowMinute, activeDayKey, evaluationsNow]);

  return (
    <div className="relative min-h-screen min-h-[100dvh] bg-background text-foreground safe-area-container overflow-x-hidden">
      <AmbientBackground openMarketsCount={openMarketsCount} />

      <div className="relative z-10 max-w-[1480px] w-full mx-auto flex flex-col gap-3 sm:gap-4 md:gap-5 overflow-x-hidden">
        <Header
          now={now}
          timeFormatted={timeFormatted}
          dateFormatted={dateFormatted}
          openMarketsCount={openMarketsCount}
          totalMarketsCount={MARKETS.length}
          onOpenEvents={handleOpenAllEvents}
          hasUpcomingCatalysts={hasUpcomingCatalysts}
          notificationsEnabled={notificationPreferences.enabled}
          notificationPermission={notificationPermission}
          onToggleNotifications={toggleNotifications}
          markets={MARKETS}
          subscribedMarketIds={notificationPreferences.subscribedMarketIds}
          onToggleMarketAlert={toggleMarketSubscription}
        />

        <main className="flex flex-col gap-3 sm:gap-4 md:gap-5">
          <LiveStatusBar
            summary={liveStatusSummary}
            totalMarkets={MARKETS.length}
          />

          <TodayAgendaStrip
            agenda={todayAgenda}
            onEventClick={setSelectedEventForModal}
            onOpenDrawer={handleOpenEvents}
          />

          <TimelineGrid
            markets={MARKETS}
            marketSegments={marketSegments}
            scrubberEvaluations={!isViewingToday || isScrubbing || simulateWeekday ? evaluationsScrubber : evaluationsNow}
            chileScrubberEvaluation={chileScrubberEvaluation}
            scrubberMinutes={scrubberMinutes}
            currentMinutes={currentMinutes}
            isHovering={isScrubbing}
            isPinned={isPinned}
            containerRef={containerRef}
            dailyEvents={dailyEvents}
            onEventClick={setSelectedEventForModal}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            onPointerLeave={handlePointerLeave}
            onKeyDown={handleKeyDown}
            onResetScrubber={handleResetToNow}
            rollingDays={rollingDays}
            selectedIsoDate={activeDay.isoDate}
            onSelectDay={handleSelectDay}
            isToday={isViewingToday}
            isWeekendDay={isSelectedDayWeekend}
            simulateWeekday={simulateWeekday}
            onToggleSimulateWeekday={handleToggleSimulateWeekday}
            nextReopenLabel={nextReopenLabel}
          />

          <section aria-label="Resumen de bolsas en hora de Chile" className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 px-0.5">
              <h2 className="text-xs sm:text-sm font-semibold text-zinc-200 tracking-tight">
                Horarios por bolsa (Hora Chile)
              </h2>
              <span className="text-[11px] text-muted-foreground">
                Toca una bolsa para ver su agenda
              </span>
            </div>
            <MarketCards
              markets={MARKETS}
              evaluations={evaluationsNow}
              onSelectMarketEvents={handleOpenEvents}
              catalystsMap={catalystsMap}
              referenceDate={chileNowMinute}
            />
          </section>
        </main>

        <footer className="border-t border-border neon-edge pt-3 pb-4 mt-1 md:pt-5 md:pb-6">
          <div className="flex justify-between items-center flex-wrap gap-2 text-xs text-muted-foreground">
            <p>
              Horarios ajustados automáticamente según cambio de hora oficial.
            </p>
            <p className="font-mono text-zinc-400">
              Referencia: Santiago, {CHILE_CONFIG.country} · {santiagoOffsetDescription}
            </p>
          </div>
        </footer>
      </div>

      <EventsDrawer
        isOpen={isEventsDrawerOpen}
        onClose={handleCloseEvents}
        selectedMarketId={selectedEventMarket}
        onSelectMarketId={setSelectedEventMarket}
        chileNow={chileNowMinute}
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
