import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  Layers, 
  Clock, 
  Flame, 
  AlertCircle, 
  Coffee,
  Sparkles
} from 'lucide-react';
import { 
  MarketConfig, 
  MarketEvaluation, 
  TimelineSegment, 
  TimelineEventMarkerData, 
  RollingDayInfo,
  TradingWindow
} from '../../core/types';
import { getTradingWindows } from '../../core/trading-windows';
import { TimelineGrid } from '../TimelineGrid';
import { TimelineWeekSelector } from '../timeline/TimelineWeekSelector';
import { Badge } from '../ui/badge';

interface TradingWindowsRadarProps {
  markets: MarketConfig[];
  marketSegments: Record<string, TimelineSegment[]>;
  scrubberEvaluations: Record<string, MarketEvaluation>;
  chileScrubberEvaluation: MarketEvaluation;
  scrubberMinutes: number;
  currentMinutes: number;
  isHovering: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
  dailyEvents?: Record<string, TimelineEventMarkerData[]>;
  onSelectEvent?: (marketId: string) => void;
  onEventClick?: (event: TimelineEventMarkerData) => void;
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerCancel?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerLeave: (e: React.PointerEvent<HTMLDivElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  onResetScrubber?: () => void;
  rollingDays?: RollingDayInfo[];
  selectedIsoDate?: string;
  onSelectDay?: (day: RollingDayInfo) => void;
  isToday?: boolean;
}

export const TradingWindowsRadar: React.FC<TradingWindowsRadarProps> = React.memo((props) => {
  const {
    markets,
    currentMinutes,
    rollingDays,
    selectedIsoDate,
    onSelectDay,
    isToday = true,
    onEventClick
  } = props;

  // View mode: 'radar' (default) vs 'timeline'
  const [viewMode, setViewMode] = useState<'radar' | 'timeline'>('radar');

  // Selected active day object
  const activeDay = useMemo(() => {
    return rollingDays?.find((d) => d.isoDate === selectedIsoDate) ?? rollingDays?.[0];
  }, [rollingDays, selectedIsoDate]);

  // Compute trading windows for the active date
  const windows: TradingWindow[] = useMemo(() => {
    if (!activeDay) return [];
    return getTradingWindows(
      activeDay.date,
      markets,
      isToday ? currentMinutes : undefined
    );
  }, [activeDay, markets, currentMinutes, isToday]);

  // Current active window (if viewing today)
  const currentWindow = useMemo(() => {
    return windows.find((w) => w.isCurrent);
  }, [windows]);

  // Next upcoming window
  const nextWindow = useMemo(() => {
    if (!currentWindow) return windows[0];
    const currentIndex = windows.findIndex((w) => w.id === currentWindow.id);
    return windows[(currentIndex + 1) % windows.length];
  }, [windows, currentWindow]);

  return (
    <section className="rounded-xl border border-border bg-card backdrop-blur-md p-3 sm:p-4 md:p-5 shadow-neon flex flex-col gap-3.5 sm:gap-4 relative overflow-hidden">
      {/* Top Header & View Controls */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-border flex items-center justify-center text-zinc-200">
              {viewMode === 'radar' ? <Zap size={15} className="text-emerald-400" /> : <Layers size={15} className="text-sky-400" />}
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold tracking-tight text-zinc-100 flex items-center gap-2">
                <span>{viewMode === 'radar' ? 'Radar de Concurrencia Bursátil' : 'Línea de Tiempo 24 Horas'}</span>
                <span className="text-[10px] font-mono font-medium text-zinc-300 bg-white/[0.04] px-2 py-0.5 rounded border border-border">
                  🇨🇱 Santiago
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs text-muted-foreground">
                {viewMode === 'radar'
                  ? 'Ventanas de liquidez y solapamiento institucional durante las 24 horas'
                  : 'Proyección horaria interactiva con cursor y catalizadores macro'}
              </p>
            </div>
          </div>

          {/* Dual Mode Switch (Segmented Control) */}
          <div className="flex items-center w-full sm:w-auto rounded-lg border border-border bg-muted p-0.5 gap-0.5 select-none">
            <button
              type="button"
              onClick={() => setViewMode('radar')}
              className={`flex-1 sm:flex-initial justify-center flex items-center gap-1.5 min-h-[34px] px-3 py-1 rounded-md text-xs font-medium transition-colors duration-150 cursor-pointer ${
                viewMode === 'radar'
                  ? 'bg-card border border-border-strong text-zinc-100 shadow-2xs'
                  : 'text-muted-foreground hover:text-zinc-200 border border-transparent'
              }`}
            >
              <Zap size={13} className={viewMode === 'radar' ? 'text-emerald-400' : ''} />
              <span>Ventanas (Radar)</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('timeline')}
              className={`flex-1 sm:flex-initial justify-center flex items-center gap-1.5 min-h-[34px] px-3 py-1 rounded-md text-xs font-medium transition-colors duration-150 cursor-pointer ${
                viewMode === 'timeline'
                  ? 'bg-card border border-border-strong text-zinc-100 shadow-2xs'
                  : 'text-muted-foreground hover:text-zinc-200 border border-transparent'
              }`}
            >
              <Layers size={13} className={viewMode === 'timeline' ? 'text-sky-400' : ''} />
              <span>Línea 24h</span>
            </button>
          </div>
        </div>

        {/* Rolling Week Day Selector */}
        {rollingDays && selectedIsoDate && onSelectDay && (
          <TimelineWeekSelector
            days={rollingDays}
            selectedIsoDate={selectedIsoDate}
            onSelectDay={onSelectDay}
          />
        )}
      </div>

      <AnimatePresence mode="wait">
        {viewMode === 'radar' ? (
          <motion.div
            key="radar-view"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col gap-3.5"
          >
            {/* Live Hero Banner: Active Window Now */}
            {isToday && currentWindow && (
              <div className="relative rounded-xl border border-emerald-500/30 bg-emerald-500/[0.03] p-3.5 sm:p-4 flex flex-col gap-3 overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                    </span>
                    <span className="text-[10px] sm:text-xs font-mono font-semibold uppercase tracking-wider text-emerald-400">
                      Ventana Operativa Activa en Santiago
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 font-mono text-[11px] text-zinc-300">
                    <Clock size={12} className="text-emerald-400" />
                    <span className="tabular-nums">
                      {currentWindow.startTimeFormatted} – {currentWindow.endTimeFormatted} (Chile)
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-zinc-100 flex items-center gap-2">
                      <span>{currentWindow.icon}</span>
                      <span>{currentWindow.name}</span>
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {currentWindow.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {currentWindow.activeMarkets.length > 0 ? (
                      <div className="flex items-center gap-1.5 bg-muted border border-border px-2.5 py-1 rounded-md">
                        <span className="text-xs font-mono text-muted-foreground">Abiertos:</span>
                        <div className="flex items-center gap-1">
                          {currentWindow.activeMarkets.map((m) => (
                            <span 
                              key={m.id} 
                              className="text-sm inline-flex items-center" 
                              title={`${m.name} (${m.code})`}
                            >
                              {m.flag}
                            </span>
                          ))}
                        </div>
                        <span className="text-xs font-mono font-semibold text-emerald-400 ml-0.5 tabular-nums">
                          ({currentWindow.concurrencyCount})
                        </span>
                      </div>
                    ) : (
                      <Badge variant="outline" className="text-xs text-zinc-400 font-mono">
                        Pausa Inter-Sesión
                      </Badge>
                    )}

                    <Badge
                      variant={
                        currentWindow.liquidityLevel === 'high'
                          ? 'open'
                          : currentWindow.liquidityLevel === 'moderate'
                          ? 'lunch'
                          : 'closed'
                      }
                      className="text-[11px] font-mono font-semibold uppercase"
                    >
                      {currentWindow.liquidityLevel === 'high'
                        ? 'Alta Concurrencia'
                        : currentWindow.liquidityLevel === 'moderate'
                        ? 'Concurrencia Moderada'
                        : 'Receso Global'}
                    </Badge>
                  </div>
                </div>

                {/* Progress bar of current window */}
                {currentWindow.progressPercent !== undefined && (
                  <div className="flex flex-col gap-1.5 pt-1">
                    <div className="w-full h-1 rounded-full bg-white/[0.07] overflow-hidden">
                      <motion.div
                        className="h-full bg-emerald-400 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${currentWindow.progressPercent}%` }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-mono text-muted-foreground tabular-nums">
                      <span>Progreso de ventana: {currentWindow.progressPercent}%</span>
                      <span>
                        {currentWindow.minutesRemaining !== undefined && currentWindow.minutesRemaining > 0
                          ? `Quedan ${Math.floor(currentWindow.minutesRemaining / 60)}h ${currentWindow.minutesRemaining % 60}m`
                          : 'Finalizando'}
                      </span>
                    </div>
                    {nextWindow && (
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground pt-1 border-t border-border">
                        <span className="text-zinc-300 font-semibold">Próxima fase:</span>
                        <span>{nextWindow.icon} {nextWindow.name}</span>
                        <span className="text-zinc-500 tabular-nums">({nextWindow.startTimeFormatted} STGO)</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Grid of 24-Hour Trading Windows */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
              {windows.map((win) => {
                const isHighLiquidity = win.liquidityLevel === 'high';
                const isModerate = win.liquidityLevel === 'moderate';

                return (
                  <div
                    key={win.id}
                    className={`relative rounded-xl border p-3.5 sm:p-4 flex flex-col justify-between gap-3 transition-colors duration-150 ${
                      win.isCurrent
                        ? 'border-emerald-500/40 bg-emerald-500/[0.03]'
                        : 'border-border bg-muted/40 hover:border-border-strong hover:bg-muted/60'
                    }`}
                  >
                    {/* Top Row: Time Range + Liquidity Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-zinc-100 tabular-nums">
                        <Clock size={13} className={win.isCurrent ? 'text-emerald-400' : 'text-zinc-400'} />
                        <span>{win.startTimeFormatted} – {win.endTimeFormatted}</span>
                        <span className="text-[10px] font-normal text-muted-foreground ml-0.5">
                          ({win.durationFormatted})
                        </span>
                      </div>

                      <Badge
                        variant={isHighLiquidity ? 'open' : isModerate ? 'lunch' : 'closed'}
                        className="text-[9px] sm:text-[10px] font-mono font-semibold uppercase py-0.5"
                      >
                        {isHighLiquidity ? 'Alta Liquidez' : isModerate ? 'Moderada' : 'Pausa'}
                      </Badge>
                    </div>

                    {/* Window Name & Subtitle */}
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">{win.icon}</span>
                        <h4 className="text-xs sm:text-sm font-semibold text-zinc-100 leading-tight">
                          {win.name}
                        </h4>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">
                        {win.subtitle}
                      </p>
                    </div>

                    {/* Markets participating in this window */}
                    <div className="flex flex-col gap-1.5 border-t border-border pt-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase text-muted-foreground font-medium">
                          Mercados en sesión:
                        </span>
                        {win.activeMarkets.length > 0 && (
                          <span className="text-[10px] font-mono font-semibold text-zinc-300 tabular-nums">
                            {win.concurrencyCount} {win.concurrencyCount === 1 ? 'mercado' : 'mercados'}
                          </span>
                        )}
                      </div>

                      {win.activeMarkets.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {win.activeMarkets.map((m) => (
                            <span
                              key={m.id}
                              className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-medium font-mono px-2 py-0.5 rounded bg-white/[0.03] border border-border text-zinc-200"
                              title={`${m.name} (${m.code}) - ${m.notes ?? ''}`}
                            >
                              <span>{m.flag}</span>
                              <span className="font-semibold">{m.code}</span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[11px] font-mono text-zinc-500 flex items-center gap-1.5">
                          <Coffee size={12} />
                          <span>Sin ruedas abiertas (receso interbursátil)</span>
                        </div>
                      )}

                      {/* Holiday warning for target markets */}
                      {win.holidayNames && win.holidayNames.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {win.holidayNames.map((h, i) => (
                            <span
                              key={i}
                              className="text-[9.5px] font-mono font-medium text-violet-300 bg-violet-500/10 border border-violet-500/25 px-1.5 py-0.5 rounded flex items-center gap-1"
                            >
                              <span className="truncate max-w-[200px]">Feriado {h}</span>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Macro Catalysts in this window */}
                      {win.events.length > 0 && (
                        <div className="flex flex-col gap-1 mt-1">
                          <span className="text-[9.5px] font-mono text-muted-foreground flex items-center gap-1">
                            <Sparkles size={10} className="text-amber-400" />
                            <span>Catalizadores macro en esta franja:</span>
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {win.events.map((evt) => (
                              <button
                                key={evt.id}
                                type="button"
                                onClick={() => onEventClick?.(evt)}
                                className={`inline-flex items-center gap-1.5 min-h-[32px] text-[10px] font-mono px-2.5 py-1 rounded-md border text-left cursor-pointer transition-colors ${
                                  evt.importance === 'high'
                                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-300 hover:bg-rose-500/15'
                                    : 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/15'
                                }`}
                                title={`Ver detalles de ${evt.title}`}
                              >
                                {evt.importance === 'high' ? (
                                  <Flame size={10} className="text-rose-400 shrink-0" />
                                ) : (
                                  <AlertCircle size={10} className="text-amber-400 shrink-0" />
                                )}
                                <span className="font-semibold tabular-nums">{evt.chileTimeFormatted.split(' ')[0]}</span>
                                <span className="truncate max-w-[130px] sm:max-w-[170px]">{evt.title}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="timeline-view"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
          >
            <TimelineGrid {...props} />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
});

TradingWindowsRadar.displayName = 'TradingWindowsRadar';
