import React, { useMemo } from 'react';
import { MARKETS, CHILE_CONFIG } from './core/markets';
import {
  projectMarketToTimeline,
  evaluateMarketAt,
  minuteOffsetToDateTime,
  formatMinutes
} from './core/timezone';
import { MarketEvaluation } from './core/types';
import { useCurrentTime } from './hooks/useCurrentTime';
import { useScrubber } from './hooks/useScrubber';
import { usePullToRefresh } from './hooks/usePullToRefresh';
import { Header } from './components/Header';
import { MarketCards } from './components/MarketCards';
import { TimelineGrid } from './components/TimelineGrid';
import { RotateCw } from 'lucide-react';

export const App: React.FC = () => {
  const { now, currentMinutes, timeFormatted, dateFormatted, minuteKey } = useCurrentTime();

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

  // Precompute 24h timeline segments for each market against Chile reference day
  const marketSegments = useMemo(() => {
    const map: Record<string, ReturnType<typeof projectMarketToTimeline>> = {};
    for (const m of MARKETS) {
      map[m.id] = projectMarketToTimeline(m, now);
    }
    return map;
  }, [referenceDayKey]);

  // Real-time evaluation at minute resolution (stable reference within the same minute)
  const evaluationsNow = useMemo(() => {
    const map: Record<string, MarketEvaluation> = {};
    for (const m of MARKETS) {
      map[m.id] = evaluateMarketAt(m, now);
    }
    return map;
  }, [minuteKey]);

  // Scrubber evaluation at selected minute offset (stable reference across seconds)
  const scrubberInstant = useMemo(() => {
    return minuteOffsetToDateTime(scrubberMinutes, now);
  }, [scrubberMinutes, referenceDayKey]);

  const evaluationsScrubber = useMemo(() => {
    const map: Record<string, MarketEvaluation> = {};
    for (const m of MARKETS) {
      // Use simulation mode during scrubbing so sessions can be visually inspected even on weekends
      map[m.id] = evaluateMarketAt(m, scrubberInstant, { isSimulation: true });
    }
    return map;
  }, [scrubberInstant]);

  const chileScrubberEvaluation: MarketEvaluation = useMemo(() => {
    return {
      marketId: 'chile',
      status: 'closed',
      localTimeFormatted: formatMinutes(scrubberMinutes),
      localDateFormatted: scrubberInstant.toFormat("ccc d MMM", { locale: 'es' })
    };
  }, [scrubberMinutes, scrubberInstant]);

  const openMarketsCount = useMemo(
    () => Object.values(evaluationsNow).filter((ev) => ev.status === 'open').length,
    [evaluationsNow]
  );

  const isScrubbing = isHovering || isDragging || Math.abs(scrubberMinutes - currentMinutes) > 2;

  return (
    <div className="min-h-screen min-h-[100dvh] bg-[#06080f] text-slate-100 safe-area-container px-3.5 py-3.5 sm:px-5 sm:py-4 md:px-8 md:py-5 lg:px-10 overflow-x-hidden ambient-grid">
      {/* Native-style Pull to Refresh indicator */}
      <div
        className="fixed top-3 left-0 right-0 flex justify-center items-center z-[1000] pointer-events-none transition-opacity duration-200"
        style={{
          transform: `translateY(${Math.max(0, pullDistance - 45)}px)`,
          opacity: pullDistance > 10 ? Math.min((pullDistance - 10) / 40, 1) : 0
        }}
      >
        <div className="inline-flex items-center gap-2 bg-slate-900/95 backdrop-blur-xl border border-sky-400/40 shadow-[0_8px_24px_-4px_rgba(0,0,0,0.8),0_0_16px_rgba(56,189,248,0.25)] px-3.5 py-1.5 rounded-full text-white font-mono text-xs font-bold">
          <RotateCw
            size={14}
            className={`text-sky-400 transition-transform duration-75 ${isRefreshing ? 'animate-spin !text-emerald-400' : ''}`}
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
        className="max-w-[1480px] w-full mx-auto flex flex-col gap-4 sm:gap-5 md:gap-6 overflow-x-hidden"
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
        />

        <main className="flex flex-col gap-4 sm:gap-5 md:gap-6">
          <MarketCards markets={MARKETS} evaluations={evaluationsNow} />

          <TimelineGrid
            markets={MARKETS}
            marketSegments={marketSegments}
            scrubberEvaluations={evaluationsScrubber}
            chileScrubberEvaluation={chileScrubberEvaluation}
            scrubberMinutes={scrubberMinutes}
            currentMinutes={currentMinutes}
            isHovering={isScrubbing}
            containerRef={containerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            onPointerLeave={handlePointerLeave}
            onKeyDown={handleKeyDown}
          />
        </main>

        <footer className="border-t border-white/10 pt-8 pb-8 mt-4">
          <div className="flex justify-between items-center flex-wrap gap-4 md:gap-6 text-xs text-slate-400">
            <div className="max-w-2xl leading-relaxed">
              <strong className="text-slate-200">Zonas Horarias Dinámicas IANA:</strong> Cálculos recalculados en vivo para evitar offsets estáticos. Chile se encuentra en horario de verano (UTC-3) hasta abril de 2027.
            </div>
            <div className="font-mono font-semibold text-slate-300">
              PWA instalable · Base de datos IANA v2026 · {CHILE_CONFIG.country}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;
