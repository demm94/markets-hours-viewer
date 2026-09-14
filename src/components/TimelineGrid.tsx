import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { MarketConfig, MarketEvaluation, TimelineSegment } from '../core/types';
import { CHILE_CONFIG } from '../core/markets';
import { formatMinutes } from '../core/timezone';
import { ChevronLeft, ChevronRight, PanelLeftClose, PanelLeftOpen, Target } from 'lucide-react';

const HOURS = Array.from({ length: 13 }, (_, i) => i * 2); // 0, 2, 4, ... 24

const CHILE_MARKET: MarketConfig = {
  ...CHILE_CONFIG,
  sessions: []
};

interface TimelineGridProps {
  markets: MarketConfig[];
  marketSegments: Record<string, TimelineSegment[]>;
  scrubberEvaluations: Record<string, MarketEvaluation>;
  chileScrubberEvaluation: MarketEvaluation;
  scrubberMinutes: number;
  currentMinutes: number;
  isHovering: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerCancel?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerLeave: () => void;
}

export const TimelineGrid: React.FC<TimelineGridProps> = React.memo(({
  markets,
  marketSegments,
  scrubberEvaluations,
  chileScrubberEvaluation,
  scrubberMinutes,
  currentMinutes,
  isHovering,
  containerRef,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onPointerLeave
}) => {
  const tableWrapperRef = useRef<HTMLDivElement | null>(null);
  const [scrollRatio, setScrollRatio] = useState<number>(0);

  const hours = HOURS;
  const scrubberPercent = (scrubberMinutes / 1440) * 100;
  const nowPercent = (currentMinutes / 1440) * 100;

  // Default to collapsed on mobile viewports (<= 768px) to maximize timeline space
  const [isColumnCollapsed, setIsColumnCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth <= 768;
    }
    return false;
  });

  const toggleColumn = useCallback(() => setIsColumnCollapsed((prev) => !prev), []);

  // Synchronize range slider when user scrolls table natively
  const handleTableScroll = useCallback(() => {
    if (!tableWrapperRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = tableWrapperRef.current;
    const maxScroll = scrollWidth - clientWidth;
    if (maxScroll > 0) {
      setScrollRatio(scrollLeft / maxScroll);
    }
  }, []);

  // Synchronize table position when user drags slider
  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newRatio = parseFloat(e.target.value);
    setScrollRatio(newRatio);
    if (tableWrapperRef.current) {
      const { scrollWidth, clientWidth } = tableWrapperRef.current;
      const maxScroll = scrollWidth - clientWidth;
      tableWrapperRef.current.scrollLeft = newRatio * maxScroll;
    }
  }, []);

  // Center timeline viewport on the red "AHORA" indicator line
  const scrollToNow = useCallback(() => {
    if (!tableWrapperRef.current) return;
    const { scrollWidth, clientWidth } = tableWrapperRef.current;
    const maxScroll = scrollWidth - clientWidth;
    if (maxScroll <= 0) return;

    const leftCol = tableWrapperRef.current.querySelector('.timeline-left-column') as HTMLElement | null;
    const leftWidth = leftCol?.offsetWidth ?? (isColumnCollapsed ? 52 : 180);
    const barsWidth = scrollWidth - leftWidth;
    const nowPx = leftWidth + (nowPercent / 100) * barsWidth;

    const target = Math.max(0, Math.min(maxScroll, nowPx - clientWidth / 2));
    tableWrapperRef.current.scrollTo({
      left: target,
      behavior: 'smooth'
    });
  }, [nowPercent, isColumnCollapsed]);

  const scrollToNowRef = useRef(scrollToNow);
  scrollToNowRef.current = scrollToNow;

  const hasInitialCenteredRef = useRef<boolean>(false);

  // Initial center on current time (once) and window resize listener
  useEffect(() => {
    const handleResize = () => {
      handleTableScroll();
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    let timer: ReturnType<typeof setTimeout> | undefined;
    if (!hasInitialCenteredRef.current) {
      hasInitialCenteredRef.current = true;
      timer = setTimeout(() => {
        scrollToNowRef.current();
        handleTableScroll();
      }, 150);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (timer) clearTimeout(timer);
    };
  }, [handleTableScroll]);

  const allMarkets = useMemo(() => [CHILE_MARKET, ...markets], [markets]);

  const getStatusBadge = useCallback((marketId: string, evaluation: MarketEvaluation) => {
    if (marketId === 'chile') {
      return <span className="status-badge-compact status-reference">Referencia</span>;
    }
    switch (evaluation.status) {
      case 'open':
        return <span className="status-badge-compact status-open">Abierto</span>;
      case 'lunch':
        return <span className="status-badge-compact status-lunch">Almuerzo</span>;
      case 'pre_market':
        return <span className="status-badge-compact status-pre">Pre-apertura</span>;
      default:
        return <span className="status-badge-compact status-closed">Cerrado</span>;
    }
  }, []);

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h2 className="text-[clamp(0.85rem,3.2vw,1.05rem)] font-bold text-slate-100 tracking-tight">Línea de Tiempo 24 Horas (Hora de Chile)</h2>
        <div className="flex items-center gap-3">
          <motion.button
            type="button"
            onClick={toggleColumn}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-1.5 bg-slate-900/80 border border-sky-400/30 text-sky-400 rounded-lg px-2.5 py-1.5 font-mono text-xs font-semibold cursor-pointer shadow-[0_0_10px_rgba(56,189,248,0.12)] min-h-[36px]"
            title={isColumnCollapsed ? 'Expandir nombres y detalles de mercados' : 'Colapsar a solo banderas para más espacio'}
          >
            {isColumnCollapsed ? <PanelLeftOpen size={13} /> : <PanelLeftClose size={13} />}
            <span>{isColumnCollapsed ? 'Ver mercados' : 'Colapsar mercados'}</span>
          </motion.button>
          <span className="font-mono text-xs font-semibold text-sky-400 bg-sky-400/10 px-2.5 py-1 rounded-lg border border-sky-400/25 shadow-[0_0_12px_rgba(56,189,248,0.12)] hidden md:inline">
            Pasa el cursor o desliza sobre la cuadrícula para sincronizar horarios
          </span>
        </div>
      </div>

      <div 
        className="timeline-table-wrapper"
        ref={tableWrapperRef}
        onScroll={handleTableScroll}
      >
        {/* Left Frozen Column: Market Identity & Scrubber readout */}
        <motion.div layout className={`timeline-left-column ${isColumnCollapsed ? 'column-collapsed' : ''}`}>
          <div className="timeline-col-header">
            {!isColumnCollapsed && <span>Mercado</span>}
            <motion.button
              type="button"
              onClick={toggleColumn}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              className="collapse-toggle-icon-btn"
              title={isColumnCollapsed ? 'Expandir columna de mercados' : 'Colapsar a solo banderas'}
              aria-label={isColumnCollapsed ? 'Expandir columna' : 'Colapsar columna'}
            >
              {isColumnCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
            </motion.button>
          </div>

          {allMarkets.map((market) => {
            const isChile = market.id === 'chile';
            const ev = isChile ? chileScrubberEvaluation : (scrubberEvaluations[market.id] ?? {
              marketId: market.id,
              status: 'closed',
              localTimeFormatted: '--:--',
              localDateFormatted: ''
            });

            return (
              <motion.div
                layout
                key={market.id}
                className={`market-info-cell ${isChile ? 'cell-anchor' : ''} ${isColumnCollapsed ? 'cell-collapsed' : ''}`}
                title={isColumnCollapsed ? `${market.name} (${market.code}) - ${ev.localTimeFormatted}` : undefined}
              >
                <div className="cell-identity">
                  <span className="cell-flag">{market.flag}</span>
                  {!isColumnCollapsed && (
                    <div className="cell-names">
                      <span className="cell-name">{market.name}</span>
                      <span className="cell-code">{market.code}</span>
                    </div>
                  )}
                </div>

                {!isColumnCollapsed && (
                  <div className="cell-scrubber-peek">
                    <span className="cell-scrubber-time">{ev.localTimeFormatted}</span>
                    {getStatusBadge(market.id, ev)}
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.div>

        {/* Right Scrollable/Interactive Column: 24h Bars Grid */}
        <div
          className="timeline-bars-container"
          ref={containerRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          onPointerLeave={onPointerLeave}
        >
          {/* Hour Labels at Top */}
          <div className="timeline-col-header-bars">
            {hours.map((h) => {
              const transform =
                h === 0
                  ? 'translate(4px, -50%)'
                  : h === 24
                  ? 'translate(calc(-100% - 4px), -50%)'
                  : 'translate(-50%, -50%)';

              return (
                <div
                  key={h}
                  className="hour-tick-label"
                  style={{ left: `${(h / 24) * 100}%`, transform }}
                >
                  {h.toString().padStart(2, '0')}:00
                </div>
              );
            })}
          </div>

          {/* Background Vertical Grid Lines */}
          <div className="bars-grid-overlay">
            {hours.map((h) => (
              <div
                key={h}
                className={`grid-line ${h % 6 === 0 ? 'grid-line-major' : ''}`}
                style={{ left: `${(h / 24) * 100}%` }}
              />
            ))}
          </div>

          {/* Market Bar Rows */}
          <div className="bars-rows-stack">
            {allMarkets.map((market) => {
              const isChile = market.id === 'chile';
              const segments = isChile ? [] : (marketSegments[market.id] ?? []);

              return (
                <div
                  key={market.id}
                  className={`bar-row-track ${isChile ? 'bar-row-anchor' : ''}`}
                >
                  <div className="bar-track-bg">
                    {/* If Chile anchor, show continuous subtle reference track */}
                    {isChile && (
                      <div className="chile-reference-bar">
                        <span className="chile-ref-text">Eje 24h Santiago de Chile</span>
                      </div>
                    )}

                    {/* Render Segments - Pure clean color blocks without inner text */}
                    {segments.map((seg, idx) => {
                      const leftPercent = (seg.startMinute / 1440) * 100;
                      const widthPercent = ((seg.endMinute - seg.startMinute) / 1440) * 100;
                      const isActive = scrubberMinutes >= seg.startMinute && scrubberMinutes < seg.endMinute;

                      return (
                        <div
                          key={idx}
                          className={`session-block session-${seg.type} ${isActive ? 'session-scrubber-active' : ''}`}
                          style={{
                            left: `${leftPercent}%`,
                            width: `${widthPercent}%`
                          }}
                          title={`${market.name} - ${seg.label ?? seg.type}: ${(seg.startMinute / 60).toFixed(1)}h - ${(seg.endMinute / 60).toFixed(1)}h (Chile)`}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Persistent "Now" Line */}
          <div
            className="now-indicator-line"
            style={{ left: `${nowPercent}%` }}
          >
            <div
              className="now-indicator-badge"
              style={{
                transform:
                  nowPercent < 4
                    ? 'translate(6px, 0)'
                    : nowPercent > 96
                    ? 'translate(calc(-100% - 6px), 0)'
                    : 'translateX(-50%)'
              }}
            >
              <span className="now-pulse" />
              <span>
                {isHovering && Math.abs(scrubberMinutes - currentMinutes) > 2
                  ? 'AHORA'
                  : `AHORA 🇨🇱 ${formatMinutes(currentMinutes)}`}
              </span>
            </div>

            {/* When left column is collapsed and idle, show current country times on Now line */}
            {isColumnCollapsed && !(isHovering && Math.abs(scrubberMinutes - currentMinutes) > 2) && (
              <div className="scrubber-row-times-overlay">
                {allMarkets.map((market, idx) => {
                  const isChile = market.id === 'chile';
                  const ev = isChile
                    ? chileScrubberEvaluation
                    : (scrubberEvaluations[market.id] ?? {
                        marketId: market.id,
                        status: 'closed',
                        localTimeFormatted: '--:--',
                        localDateFormatted: ''
                      });

                  const topPx = 40 + idx * 54 + 27;
                  const edgeTransform =
                    nowPercent < 4
                      ? 'translate(6px, -50%)'
                      : nowPercent > 96
                      ? 'translate(calc(-100% - 6px), -50%)'
                      : 'translate(-50%, -50%)';

                  const statusClass = isChile ? 'status-reference' : `status-${ev.status}`;

                  return (
                    <div
                      key={market.id}
                      className={`scrubber-row-pill ${statusClass}`}
                      style={{
                        top: `${topPx}px`,
                        transform: edgeTransform
                      }}
                      title={`${market.name}: ${ev.localTimeFormatted}`}
                    >
                      <span className="scrubber-row-flag">{market.flag}</span>
                      <span className="scrubber-row-time">{ev.localTimeFormatted}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Interactive Scrubber Line (rendered when user actively scrubs to a different time) */}
          {isHovering && Math.abs(scrubberMinutes - currentMinutes) > 2 && (
            <div
              className="scrubber-crosshair-line scrubber-active"
              style={{ left: `${scrubberPercent}%` }}
            >
              <div
                className="scrubber-badge"
                style={{
                  transform:
                    scrubberPercent < 4
                      ? 'translate(6px, 0)'
                      : scrubberPercent > 96
                      ? 'translate(calc(-100% - 6px), 0)'
                      : 'translateX(-50%)'
                }}
              >
                <span className="scrubber-badge-text">
                  🇨🇱 {formatMinutes(scrubberMinutes)}
                </span>
              </div>

              {/* When left column is collapsed and scrubbing, show projected country times on scrubber line */}
              {isColumnCollapsed && (
                <div className="scrubber-row-times-overlay">
                  {allMarkets.map((market, idx) => {
                    const isChile = market.id === 'chile';
                    const ev = isChile
                      ? chileScrubberEvaluation
                      : (scrubberEvaluations[market.id] ?? {
                          marketId: market.id,
                          status: 'closed',
                          localTimeFormatted: '--:--',
                          localDateFormatted: ''
                        });

                    const topPx = 40 + idx * 54 + 27;
                    const edgeTransform =
                      scrubberPercent < 4
                        ? 'translate(6px, -50%)'
                        : scrubberPercent > 96
                        ? 'translate(calc(-100% - 6px), -50%)'
                        : 'translate(-50%, -50%)';

                    const statusClass = isChile ? 'status-reference' : `status-${ev.status}`;

                    return (
                      <div
                        key={market.id}
                        className={`scrubber-row-pill ${statusClass}`}
                        style={{
                          top: `${topPx}px`,
                          transform: edgeTransform
                        }}
                        title={`${market.name}: ${ev.localTimeFormatted}`}
                      >
                        <span className="scrubber-row-flag">{market.flag}</span>
                        <span className="scrubber-row-time">{ev.localTimeFormatted}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Horizontal Viewport Navigator Slider */}
      <div className="timeline-slider-bar flex items-center gap-2.5 bg-slate-950/95 backdrop-blur-xl border border-sky-400/20 rounded-xl px-3 py-2 mt-2.5 shadow-[inset_0_1px_3px_rgba(0,0,0,0.5),0_8px_24px_-6px_rgba(0,0,0,0.7)] min-h-[52px]">
        <span className="font-mono text-xs font-bold text-slate-400 tabular-nums select-none">00:00</span>
        <div className="flex-1 flex items-center relative min-h-[44px]">
          <input
            type="range"
            min="0"
            max="1"
            step="0.002"
            value={scrollRatio}
            onChange={handleSliderChange}
            className="timeline-range-slider"
            aria-label="Deslizar horizontalmente por las 24 horas"
          />
        </div>
        <span className="font-mono text-xs font-bold text-slate-400 tabular-nums select-none">24:00</span>

        <motion.button
          type="button"
          onClick={scrollToNow}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.94 }}
          className="inline-flex items-center justify-center gap-1.5 bg-gradient-to-br from-rose-600/20 to-rose-600/10 text-rose-300 border border-rose-500/45 rounded-lg px-3.5 py-2 min-h-[44px] min-w-[44px] font-mono text-xs font-bold cursor-pointer whitespace-nowrap shadow-[0_0_12px_rgba(225,29,72,0.2)] select-none hover:bg-rose-600/30 hover:border-rose-500/65 hover:text-white transition-all"
          title="Centrar vista en la hora actual"
          aria-label="Centrar en hora actual"
        >
          <Target size={15} />
          <span>Ahora</span>
        </motion.button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-start md:justify-center gap-x-5 gap-y-2.5 border-t border-white/10 pt-4 text-xs font-medium text-slate-300">
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-2.5 rounded-sm bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
          <span>Mercado Abierto</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-2.5 rounded-sm bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
          <span>Almuerzo / Pre-apertura</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-2.5 rounded-sm bg-[#151d2f] border border-slate-600" />
          <span>Cerrado</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-[2.5px] rounded-[1px] bg-rose-600 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
          <span>Hora actual (Chile)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-[2.5px] rounded-[1px] bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.6)]" />
          <span>Cursor interactivo</span>
        </div>
      </div>
    </div>
  );
});

TimelineGrid.displayName = 'TimelineGrid';
