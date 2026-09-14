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

  const { pullDistance, isRefreshing, isTriggered } = usePullToRefresh({
    onRefresh: () => {
      window.location.reload();
    }
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

  const openMarketsCount = Object.values(evaluationsNow).filter(
    (ev) => ev.status === 'open'
  ).length;

  const isScrubbing = isHovering || isDragging || Math.abs(scrubberMinutes - currentMinutes) > 2;

  return (
    <div className="app-layout">
      {/* Native-style Pull to Refresh indicator */}
      <div
        className={`ptr-container ${isRefreshing ? 'ptr-refreshing' : ''}`}
        style={{
          transform: `translateY(${Math.max(0, pullDistance - 45)}px)`,
          opacity: pullDistance > 10 ? Math.min((pullDistance - 10) / 40, 1) : 0
        }}
      >
        <div className="ptr-pill">
          <RotateCw
            size={14}
            className={`ptr-icon ${isRefreshing ? 'animate-spin' : ''}`}
            style={{
              transform: isRefreshing ? undefined : `rotate(${pullDistance * 5}deg)`
            }}
          />
          <span className="ptr-text">
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

        <main className="main-content">
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

        <footer className="app-footer">
          <div className="footer-content">
            <div className="footer-note">
              <strong>Zonas Horarias Dinámicas IANA:</strong> Cálculos recalculados en vivo para evitar offsets estáticos. Chile se encuentra en horario de verano (UTC-3) hasta abril de 2027.
            </div>
            <div className="footer-meta">
              PWA instalable · Base de datos IANA v2026 · {CHILE_CONFIG.country}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;
