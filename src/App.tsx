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
  const { now, currentMinutes, timeFormatted, dateFormatted } = useCurrentTime();

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
    handlePointerLeave
  } = useScrubber(currentMinutes);

  // Precompute 24h timeline segments for each market against Chile reference day
  const marketSegments = useMemo(() => {
    const map: Record<string, ReturnType<typeof projectMarketToTimeline>> = {};
    for (const m of MARKETS) {
      map[m.id] = projectMarketToTimeline(m, now);
    }
    return map;
  }, [now.day, now.month, now.year]);

  // Real-time evaluation at this exact second
  const evaluationsNow = useMemo(() => {
    const map: Record<string, MarketEvaluation> = {};
    for (const m of MARKETS) {
      map[m.id] = evaluateMarketAt(m, now);
    }
    return map;
  }, [now]);

  // Scrubber evaluation at selected minute offset
  const scrubberInstant = useMemo(() => {
    return minuteOffsetToDateTime(scrubberMinutes, now);
  }, [scrubberMinutes, now]);

  const evaluationsScrubber = useMemo(() => {
    const map: Record<string, MarketEvaluation> = {};
    for (const m of MARKETS) {
      map[m.id] = evaluateMarketAt(m, scrubberInstant);
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
    <div className="app-layout">
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
        className="app-container"
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

        <main className="flex flex-col gap-6 md:gap-8">
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
          />
        </main>

        <footer className="border-t border-white/10 pt-6 pb-4">
          <div className="flex justify-between items-center flex-wrap gap-3.5 text-xs text-slate-400">
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
