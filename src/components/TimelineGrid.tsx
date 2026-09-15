import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { MarketConfig, MarketEvaluation, TimelineSegment } from '../core/types';
import { CHILE_CONFIG } from '../core/markets';
import { formatMinutes } from '../core/timezone';
import { ChevronLeft, ChevronRight, PanelLeftClose, PanelLeftOpen, Target } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

const HOURS = [0, 3, 6, 9, 12, 15, 18, 21, 24];
const GRID_LINES = Array.from({ length: 25 }, (_, i) => i);

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
    const leftWidth = leftCol?.offsetWidth ?? (isColumnCollapsed ? 56 : 270);
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
      return (
        <Badge variant="outline" className="text-[10px] px-2.5 py-0.5 min-h-[20px] border-sky-400/40 text-sky-300 font-mono leading-none">
          Referencia
        </Badge>
      );
    }
    const variant =
      evaluation.status === 'open'
        ? 'open'
        : evaluation.status === 'lunch'
        ? 'lunch'
        : evaluation.status === 'pre_market'
        ? 'pre'
        : 'closed';

    const text =
      evaluation.status === 'open'
        ? 'Abierto'
        : evaluation.status === 'lunch'
        ? 'Almuerzo'
        : evaluation.status === 'pre_market'
        ? 'Pre-apertura'
        : 'Cerrado';

    return (
      <Badge variant={variant} showDot={false} className="text-[10px] px-2.5 py-0.5 min-h-[20px] font-mono font-bold leading-none">
        {text}
      </Badge>
    );
  }, []);

  return (
    <section className="rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900/80 via-slate-900/60 to-slate-950/90 backdrop-blur-2xl p-3.5 sm:p-4 md:p-5 shadow-xl flex flex-col gap-3.5 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-sky-400/30 to-transparent pointer-events-none" />

      {/* Top Controls Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <h2 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
          <span>Línea de Tiempo 24 Horas (Hora de Chile)</span>
        </h2>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleColumn}
            className="gap-1.5 min-h-[34px] px-3 text-xs font-semibold"
            title={isColumnCollapsed ? 'Expandir nombres y detalles de mercados' : 'Colapsar a solo banderas para más espacio'}
          >
            {isColumnCollapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
            <span>{isColumnCollapsed ? 'Ver mercados' : 'Colapsar mercados'}</span>
          </Button>
          <span className="font-mono text-xs font-semibold text-sky-400 bg-sky-400/10 px-3 py-1 rounded-lg border border-sky-400/25 shadow-[0_0_12px_rgba(56,189,248,0.12)] hidden md:inline">
            Pasa el cursor o desliza sobre la cuadrícula para sincronizar horarios
          </span>
        </div>
      </div>

      <div 
        className="relative flex overflow-x-auto select-none rounded-2xl border border-white/10 bg-[#060911]/95 shadow-[inset_0_2px_14px_rgba(0,0,0,0.6)] touch-pan-y [scrollbar-width:thin] [scrollbar-color:rgba(56,189,248,0.35)_rgba(15,23,42,0.85)] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-slate-900/85 [&::-webkit-scrollbar-thumb]:bg-sky-400/35 hover:[&::-webkit-scrollbar-thumb]:bg-sky-400/60 [&::-webkit-scrollbar-thumb]:rounded"
        ref={tableWrapperRef}
        onScroll={handleTableScroll}
      >
        {/* Left Frozen Column: Market Identity & Scrubber readout */}
        <motion.div
          layout
          className={`timeline-left-column sticky left-0 bg-[#080c16] border-r border-white/10 shadow-[6px_0_20px_rgba(0,0,0,0.7)] flex flex-col z-10 transition-[width,min-width] duration-200 ease-out ${
            isColumnCollapsed ? 'w-14 min-w-[56px]' : 'w-[270px] min-w-[270px]'
          }`}
        >
          <div
            className={`h-11 flex items-center border-b border-white/10 bg-[#060912] font-mono text-[11px] font-bold uppercase tracking-wider text-slate-400 ${
              isColumnCollapsed ? 'justify-center px-0' : 'justify-between px-3.5'
            }`}
          >
            {!isColumnCollapsed && <span>Mercado</span>}
            <motion.button
              type="button"
              onClick={toggleColumn}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              className="inline-flex items-center justify-center bg-white/5 border border-white/10 text-slate-300 rounded-md w-6 h-6 hover:bg-sky-400/20 hover:border-sky-400/40 hover:text-sky-400 transition-colors"
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
                className={`h-[50px] flex items-center border-b border-white/5 transition-colors ${
                  isChile
                    ? 'bg-gradient-to-r from-sky-400/[0.12] to-sky-400/[0.04] border-b-sky-400/35'
                    : 'hover:bg-white/[0.02]'
                } ${isColumnCollapsed ? 'justify-center px-0' : 'justify-between px-4'}`}
                title={isColumnCollapsed ? `${market.name} (${market.code}) - ${ev.localTimeFormatted}` : undefined}
              >
                <div className={`flex items-center ${isColumnCollapsed ? 'justify-center gap-0' : 'gap-2.5'}`}>
                  <span className={`leading-none filter drop-shadow select-none ${isColumnCollapsed ? 'text-2xl' : 'text-xl'}`}>
                    {market.flag}
                  </span>
                  {!isColumnCollapsed && (
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-white whitespace-nowrap">{market.name}</span>
                      <span className="text-[10px] font-semibold text-slate-400 font-mono">{market.code}</span>
                    </div>
                  )}
                </div>

                {!isColumnCollapsed && (
                  <div className="flex flex-col items-end gap-1">
                    <span className="font-mono text-sm font-extrabold text-white tabular-nums">{ev.localTimeFormatted}</span>
                    {getStatusBadge(market.id, ev)}
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.div>

        {/* Right Scrollable/Interactive Column: 24h Bars Grid */}
        <div
          className="flex-1 min-w-[800px] relative flex flex-col cursor-crosshair touch-none select-none"
          ref={containerRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          onPointerLeave={onPointerLeave}
        >
          {/* Hour Labels at Top */}
          <div className="h-11 relative border-b border-white/10 bg-[#060912]">
            {hours.map((h) => {
              const transform =
                h === 0
                  ? 'translate(6px, -50%)'
                  : h === 24
                  ? 'translate(calc(-100% - 6px), -50%)'
                  : 'translate(-50%, -50%)';

              return (
                <div
                  key={h}
                  className="absolute top-1/2 font-mono text-xs font-semibold text-slate-400 tabular-nums select-none"
                  style={{ left: `${(h / 24) * 100}%`, transform }}
                >
                  {h.toString().padStart(2, '0')}:00
                </div>
              );
            })}
          </div>

          {/* Background Vertical Grid Lines */}
          <div className="absolute top-11 bottom-0 left-0 right-0 pointer-events-none z-[1]">
            {GRID_LINES.map((h) => (
              <div
                key={h}
                className={`absolute top-0 bottom-0 w-[1px] ${h % 3 === 0 ? 'bg-white/[0.08]' : 'bg-white/[0.02]'}`}
                style={{ left: `${(h / 24) * 100}%` }}
              />
            ))}
          </div>

          {/* Market Bar Rows */}
          <div className="relative z-[2] flex flex-col">
            {allMarkets.map((market) => {
              const isChile = market.id === 'chile';
              const segments = isChile ? [] : (marketSegments[market.id] ?? []);

              return (
                <div
                  key={market.id}
                  className={`h-[50px] px-2 flex items-center border-b border-white/5 transition-colors ${
                    isChile ? 'bg-gradient-to-r from-sky-400/[0.08] to-sky-400/[0.02] border-b-sky-400/35' : 'hover:bg-white/[0.02]'
                  }`}
                >
                  <div className="relative w-full h-[30px] bg-[#0c111e]/90 border border-white/10 rounded-lg overflow-hidden shadow-[inset_0_2px_6px_rgba(0,0,0,0.5)]">
                    {/* If Chile anchor, show continuous subtle reference track */}
                    {isChile && (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-sky-400/[0.06] via-sky-400/[0.16] to-sky-400/[0.06]">
                        <span className="font-mono text-xs font-bold text-sky-400 tracking-wider uppercase">
                          Eje 24h Santiago de Chile
                        </span>
                      </div>
                    )}

                    {/* Render Segments - Pure clean color blocks without inner text */}
                    {segments.map((seg, idx) => {
                      const leftPercent = (seg.startMinute / 1440) * 100;
                      const widthPercent = ((seg.endMinute - seg.startMinute) / 1440) * 100;
                      const isActive = scrubberMinutes >= seg.startMinute && scrubberMinutes < seg.endMinute;

                      let blockStyle = 'bg-gradient-to-b from-emerald-500 to-emerald-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_0_16px_rgba(16,185,129,0.3)]';
                      if (seg.type === 'lunch') {
                        blockStyle = 'bg-gradient-to-b from-amber-500 to-amber-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_0_14px_rgba(245,158,11,0.3)]';
                      } else if (seg.type === 'pre_market') {
                        blockStyle = 'bg-gradient-to-b from-cyan-500 to-sky-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_0_14px_rgba(6,182,212,0.3)]';
                      }

                      return (
                        <div
                          key={idx}
                          className={`absolute top-0 bottom-0 flex items-center justify-center text-[11px] font-bold rounded-md overflow-hidden whitespace-nowrap shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_2px_8px_rgba(0,0,0,0.5)] transition-[filter,box-shadow] ${blockStyle} ${
                            isActive ? 'brightness-125 ring-2 ring-white shadow-[0_0_24px_rgba(16,185,129,0.45)]' : ''
                          }`}
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
            className="absolute top-0 bottom-0 -translate-x-1/2 w-[2px] bg-rose-600 shadow-[0_0_14px_rgba(225,29,72,0.65)] z-[5] pointer-events-none"
            style={{ left: `${nowPercent}%` }}
          >
            <div
              className="absolute top-1.5 left-0 inline-flex items-center gap-1.5 bg-rose-600 text-white font-mono text-xs font-extrabold px-3 py-1 rounded-lg shadow-[0_4px_14px_rgba(225,29,72,0.65)] whitespace-nowrap tabular-nums"
              style={{
                transform:
                  nowPercent < 4
                    ? 'translate(6px, 0)'
                    : nowPercent > 96
                    ? 'translate(calc(-100% - 6px), 0)'
                    : 'translateX(-50%)'
              }}
            >
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              <span>
                {isHovering && Math.abs(scrubberMinutes - currentMinutes) > 2
                  ? 'AHORA'
                  : `AHORA 🇨🇱 ${formatMinutes(currentMinutes)}`}
              </span>
            </div>

            {/* When left column is collapsed and idle, show current country times on Now line */}
            {isColumnCollapsed && !(isHovering && Math.abs(scrubberMinutes - currentMinutes) > 2) && (
              <div className="absolute top-0 left-0 w-0 h-full pointer-events-none">
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

                  const topPx = 44 + idx * 50 + 25;
                  const edgeTransform =
                    nowPercent < 4
                      ? 'translate(6px, -50%)'
                      : nowPercent > 96
                      ? 'translate(calc(-100% - 6px), -50%)'
                      : 'translate(-50%, -50%)';

                  let statusClasses = 'border-slate-700/60 text-slate-300';
                  if (isChile) {
                    statusClasses = 'border-sky-400/70 text-sky-300 shadow-[0_4px_14px_rgba(0,0,0,0.75),0_0_12px_rgba(56,189,248,0.25)]';
                  } else if (ev.status === 'open') {
                    statusClasses = 'border-emerald-500/70 text-emerald-300 shadow-[0_4px_14px_rgba(0,0,0,0.75),0_0_12px_rgba(16,185,129,0.3)]';
                  } else if (ev.status === 'lunch') {
                    statusClasses = 'border-amber-500/70 text-amber-300 shadow-[0_4px_14px_rgba(0,0,0,0.75),0_0_10px_rgba(245,158,11,0.3)]';
                  } else if (ev.status === 'pre_market') {
                    statusClasses = 'border-cyan-500/70 text-cyan-300 shadow-[0_4px_14px_rgba(0,0,0,0.75),0_0_10px_rgba(6,182,212,0.3)]';
                  }

                  return (
                    <div
                      key={market.id}
                      className={`absolute left-0 inline-flex items-center gap-2 bg-[#080c16]/95 backdrop-blur-md border rounded-lg px-3 py-1 font-mono text-xs font-bold whitespace-nowrap shadow-lg z-10 pointer-events-none tabular-nums ${statusClasses}`}
                      style={{
                        top: `${topPx}px`,
                        transform: edgeTransform
                      }}
                      title={`${market.name}: ${ev.localTimeFormatted}`}
                    >
                      <span className="text-xs leading-none">{market.flag}</span>
                      <span>{ev.localTimeFormatted}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Interactive Scrubber Line (rendered when user actively scrubs to a different time) */}
          {isHovering && Math.abs(scrubberMinutes - currentMinutes) > 2 && (
            <div
              className="absolute top-0 bottom-0 -translate-x-1/2 w-[2.5px] bg-sky-400 shadow-[0_0_16px_rgba(56,189,248,0.75)] z-[6] pointer-events-none"
              style={{ left: `${scrubberPercent}%` }}
            >
              <div
                className="absolute top-1.5 left-0 bg-gradient-to-br from-sky-600 to-sky-700 text-white font-mono text-xs font-extrabold px-3 py-1 rounded-lg border border-white/25 shadow-[0_4px_16px_rgba(2,132,199,0.7)] whitespace-nowrap tabular-nums"
                style={{
                  transform:
                    scrubberPercent < 4
                      ? 'translate(6px, 0)'
                      : scrubberPercent > 96
                      ? 'translate(calc(-100% - 6px), 0)'
                      : 'translateX(-50%)'
                }}
              >
                <span>
                  🇨🇱 {formatMinutes(scrubberMinutes)}
                </span>
              </div>

              {/* When left column is collapsed and scrubbing, show projected country times on scrubber line */}
              {isColumnCollapsed && (
                <div className="absolute top-0 left-0 w-0 h-full pointer-events-none">
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

                    const topPx = 44 + idx * 50 + 25;
                    const edgeTransform =
                      scrubberPercent < 4
                        ? 'translate(6px, -50%)'
                        : scrubberPercent > 96
                        ? 'translate(calc(-100% - 6px), -50%)'
                        : 'translate(-50%, -50%)';

                    let statusClasses = 'border-slate-700/60 text-slate-300';
                    if (isChile) {
                      statusClasses = 'border-sky-400/70 text-sky-300 shadow-[0_4px_14px_rgba(0,0,0,0.75),0_0_12px_rgba(56,189,248,0.25)]';
                    } else if (ev.status === 'open') {
                      statusClasses = 'border-emerald-500/70 text-emerald-300 shadow-[0_4px_14px_rgba(0,0,0,0.75),0_0_12px_rgba(16,185,129,0.3)]';
                    } else if (ev.status === 'lunch') {
                      statusClasses = 'border-amber-500/70 text-amber-300 shadow-[0_4px_14px_rgba(0,0,0,0.75),0_0_10px_rgba(245,158,11,0.3)]';
                    } else if (ev.status === 'pre_market') {
                      statusClasses = 'border-cyan-500/70 text-cyan-300 shadow-[0_4px_14px_rgba(0,0,0,0.75),0_0_10px_rgba(6,182,212,0.3)]';
                    }

                    return (
                      <div
                        key={market.id}
                        className={`absolute left-0 inline-flex items-center gap-2 bg-[#080c16]/95 backdrop-blur-md border rounded-lg px-3 py-1 font-mono text-xs font-bold whitespace-nowrap shadow-lg z-10 pointer-events-none tabular-nums ${statusClasses}`}
                        style={{
                          top: `${topPx}px`,
                          transform: edgeTransform
                        }}
                        title={`${market.name}: ${ev.localTimeFormatted}`}
                      >
                        <span className="text-xs leading-none">{market.flag}</span>
                        <span>{ev.localTimeFormatted}</span>
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
      <div className="timeline-slider-bar flex items-center gap-3 bg-slate-950/90 backdrop-blur-xl border border-sky-400/20 rounded-2xl px-4 sm:px-5 py-3 mt-4 md:mt-5 shadow-[inset_0_1px_3px_rgba(0,0,0,0.5),0_8px_24px_-6px_rgba(0,0,0,0.7)] min-h-[58px]">
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

        <Button
          type="button"
          variant="now"
          onClick={scrollToNow}
          className="gap-2 px-4 py-2 min-h-[42px] min-w-[42px] cursor-pointer text-xs font-semibold"
          title="Centrar vista en la hora actual"
          aria-label="Centrar en hora actual"
        >
          <Target size={16} />
          <span>Ahora</span>
        </Button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-start md:justify-center gap-x-6 gap-y-2 border-t border-white/10 pt-3 pb-0.5 text-xs font-medium text-slate-300 mt-1">
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
    </section>
  );
});

TimelineGrid.displayName = 'TimelineGrid';
