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
  onPointerLeave: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
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
    <section className="rounded-2xl border border-border bg-card backdrop-blur-2xl p-2.5 sm:p-4 md:p-5 shadow-neon flex flex-col gap-3 sm:gap-4 relative overflow-hidden neon-edge">
      {/* Top Header & View Controls */}
      <div className="flex flex-col gap-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500/20 to-sky-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
              <Zap size={16} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold tracking-tight text-white flex items-center gap-1.5">
                <span>Radar de Concurrencia Bursátil</span>
                <span className="text-[10px] font-mono font-bold text-sky-300 bg-sky-500/15 px-2 py-0.5 rounded-full border border-sky-400/30">
                  🇨🇱 Santiago
                </span>
              </h2>
              <p className="text-[10px] sm:text-xs text-muted-foreground font-mono">
                Ventanas de liquidez y solapamiento institucional durante las 24 horas
              </p>
            </div>
          </div>

          {/* Dual Mode Switch */}
          <div className="flex items-center rounded-xl border border-border/80 bg-muted/60 p-1 gap-1 select-none">
            <button
              type="button"
              onClick={() => setViewMode('radar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                viewMode === 'radar'
                  ? 'bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                  : 'text-muted-foreground hover:text-white'
              }`}
            >
              <Zap size={13} />
              <span>Ventanas (Radar)</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('timeline')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                viewMode === 'timeline'
                  ? 'bg-sky-500/20 border border-sky-400/50 text-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.25)]'
                  : 'text-muted-foreground hover:text-white'
              }`}
            >
              <Layers size={13} />
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
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-3.5"
          >
            {/* Live Hero Banner: Active Window Now */}
            {isToday && currentWindow && (
              <div className="relative rounded-2xl border border-emerald-500/40 bg-gradient-to-r from-emerald-950/40 via-muted/50 to-sky-950/30 p-3 sm:p-4 shadow-[0_0_24px_rgba(16,185,129,0.15)] flex flex-col gap-2.5 overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2.5 w-2.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                    </span>
                    <span className="text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider text-emerald-300">
                      Ventana Operativa Activa en Santiago
                    </span>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
                    <Clock size={12} className="text-emerald-400" />
                    <span>
                      {currentWindow.startTimeFormatted} – {currentWindow.endTimeFormatted} (Chile)
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div>
                    <h3 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                      <span>{currentWindow.icon}</span>
                      <span>{currentWindow.name}</span>
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {currentWindow.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {currentWindow.activeMarkets.length > 0 ? (
                      <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 px-2.5 py-1 rounded-xl">
                        <span className="text-xs font-mono text-muted-foreground">Abiertos:</span>
                        <div className="flex items-center gap-1">
                          {currentWindow.activeMarkets.map((m) => (
                            <span 
                              key={m.id} 
                              className="text-base inline-flex items-center" 
                              title={`${m.name} (${m.code})`}
                            >
                              {m.flag}
                            </span>
                          ))}
                        </div>
                        <span className="text-xs font-mono font-bold text-emerald-400 ml-1">
                          ({currentWindow.concurrencyCount})
                        </span>
                      </div>
                    ) : (
                      <Badge variant="outline" className="text-xs border-zinc-700 bg-zinc-900/60 text-zinc-300 font-mono">
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
                      className="text-xs font-mono font-bold uppercase"
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
                  <div className="flex flex-col gap-1 pt-1">
                    <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-emerald-500 to-sky-400 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${currentWindow.progressPercent}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-mono text-muted-foreground">
                      <span>Progreso de ventana: {currentWindow.progressPercent}%</span>
                      <span>
                        {currentWindow.minutesRemaining !== undefined && currentWindow.minutesRemaining > 0
                          ? `Quedan ${Math.floor(currentWindow.minutesRemaining / 60)}h ${currentWindow.minutesRemaining % 60}m`
                          : 'Finalizando'}
                      </span>
                    </div>
                    {nextWindow && (
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground/90 pt-0.5 border-t border-white/5">
                        <span className="text-sky-400 font-bold">Próxima fase:</span>
                        <span>{nextWindow.icon} {nextWindow.name}</span>
                        <span className="text-zinc-500">({nextWindow.startTimeFormatted} STGO)</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Grid of 24-Hour Trading Windows */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3.5">
              {windows.map((win) => {
                const isHighLiquidity = win.liquidityLevel === 'high';
                const isModerate = win.liquidityLevel === 'moderate';

                return (
                  <div
                    key={win.id}
                    className={`relative rounded-xl border p-3 sm:p-4 flex flex-col justify-between gap-3 transition-all duration-200 ${
                      win.isCurrent
                        ? 'border-emerald-400/60 bg-emerald-950/20 shadow-[0_0_18px_rgba(16,185,129,0.18)] ring-1 ring-emerald-400/40'
                        : 'border-border/70 bg-muted/40 hover:border-border hover:bg-muted/70'
                    }`}
                  >
                    {/* Top Row: Time Range + Liquidity Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 font-mono text-xs font-extrabold text-white">
                        <Clock size={13} className={win.isCurrent ? 'text-emerald-400' : 'text-sky-400'} />
                        <span>{win.startTimeFormatted} – {win.endTimeFormatted}</span>
                        <span className="text-[10px] font-normal text-muted-foreground ml-1">
                          ({win.durationFormatted})
                        </span>
                      </div>

                      <Badge
                        variant={isHighLiquidity ? 'open' : isModerate ? 'lunch' : 'outline'}
                        className="text-[9px] sm:text-[10px] font-mono font-bold uppercase py-0.5"
                      >
                        {isHighLiquidity ? 'Alta Liquidez' : isModerate ? 'Moderada' : 'Pausa'}
                      </Badge>
                    </div>

                    {/* Window Name & Subtitle */}
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-lg">{win.icon}</span>
                        <h4 className="text-xs sm:text-sm font-bold text-white leading-tight">
                          {win.name}
                        </h4>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">
                        {win.subtitle}
                      </p>
                    </div>

                    {/* Markets participating in this window */}
                    <div className="flex flex-col gap-1.5 border-t border-border/50 pt-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase text-muted-foreground font-semibold">
                          Mercados en sesión:
                        </span>
                        {win.activeMarkets.length > 0 && (
                          <span className="text-[10px] font-mono font-bold text-sky-300">
                            {win.concurrencyCount} {win.concurrencyCount === 1 ? 'mercado' : 'mercados'}
                          </span>
                        )}
                      </div>

                      {win.activeMarkets.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {win.activeMarkets.map((m) => (
                            <span
                              key={m.id}
                              className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-medium font-mono px-2 py-0.5 rounded-md bg-white/[0.04] border border-border text-foreground/90"
                              title={`${m.name} (${m.code}) - ${m.notes ?? ''}`}
                            >
                              <span>{m.flag}</span>
                              <span className="font-bold">{m.code}</span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[11px] font-mono text-zinc-500 italic flex items-center gap-1">
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
                              className="text-[9.5px] font-mono font-semibold text-purple-300 bg-purple-950/40 border border-purple-500/30 px-1.5 py-0.5 rounded flex items-center gap-1"
                            >
                              <span>🎉</span>
                              <span className="truncate max-w-[200px]">{h}</span>
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
                                className={`inline-flex items-center gap-1 text-[9.5px] font-mono px-2 py-0.5 rounded border text-left cursor-pointer transition-all hover:scale-[1.02] ${
                                  evt.importance === 'high'
                                    ? 'bg-rose-500/15 border-rose-400/40 text-rose-300 shadow-[0_0_8px_rgba(244,63,94,0.2)]'
                                    : 'bg-amber-500/15 border-amber-400/40 text-amber-300'
                                }`}
                                title={`Ver detalles de ${evt.title}`}
                              >
                                {evt.importance === 'high' ? (
                                  <Flame size={10} className="text-rose-400" />
                                ) : (
                                  <AlertCircle size={10} className="text-amber-400" />
                                )}
                                <span className="font-semibold">{evt.chileTimeFormatted.split(' ')[0]}</span>
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
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <TimelineGrid {...props} />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
});

TradingWindowsRadar.displayName = 'TradingWindowsRadar';
