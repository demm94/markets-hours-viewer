import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DateTime } from 'luxon';
import { X, Calendar, Flame, AlertCircle, Building2, TrendingUp, DollarSign } from 'lucide-react';
import { EventCategory } from '../core/types';
import { MARKETS, CHILE_CONFIG } from '../core/markets';
import { getUpcomingEvents } from '../core/events';
import { getUpcomingHolidays } from '../core/holidays';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { cn } from '../lib/utils';

interface EventsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMarketId: string;
  onSelectMarketId: (marketId: string) => void;
  chileNow: DateTime;
}

const CATEGORY_LABELS: Record<EventCategory, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  central_bank: { label: 'Banco Central', icon: Building2 },
  inflation: { label: 'Inflación / IPC', icon: TrendingUp },
  gdp: { label: 'Actividad / PIB', icon: DollarSign },
  employment: { label: 'Empleo & PMI', icon: AlertCircle },
  holidays: { label: 'Feriado Bursátil', icon: Calendar }
};

export const EventsDrawer: React.FC<EventsDrawerProps> = ({
  isOpen,
  onClose,
  selectedMarketId,
  onSelectMarketId,
  chileNow
}) => {
  const [viewMode, setViewMode] = useState<'events' | 'holidays'>('events');
  const [onlyHighImportance, setOnlyHighImportance] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  // Horizontal chips navigation & drag-to-scroll support for laptop / desktop
  const chipsContainerRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasDraggedRef = useRef(false);

  const checkScrollability = useCallback(() => {
    const el = chipsContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  const handleChipsWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (chipsContainerRef.current && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      chipsContainerRef.current.scrollLeft += e.deltaY;
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!chipsContainerRef.current) return;
    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    startXRef.current = e.pageX - chipsContainerRef.current.offsetLeft;
    scrollLeftRef.current = chipsContainerRef.current.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !chipsContainerRef.current) return;
    const x = e.pageX - chipsContainerRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.5;
    if (Math.abs(walk) > 4) {
      hasDraggedRef.current = true;
    }
    chipsContainerRef.current.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    isDraggingRef.current = false;
  };

  // Check scrollability on mount, drawer open, and resize
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(checkScrollability, 100);
    window.addEventListener('resize', checkScrollability);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkScrollability);
    };
  }, [isOpen, checkScrollability]);

  // Auto-scroll selected market into view when drawer opens or market changes
  useEffect(() => {
    if (!isOpen || !chipsContainerRef.current) return;
    const activeChip = chipsContainerRef.current.querySelector<HTMLElement>('[data-active="true"]');
    if (activeChip) {
      activeChip.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      const timer = setTimeout(checkScrollability, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, selectedMarketId, checkScrollability]);

  const drawerRef = useFocusTrap<HTMLDivElement>({
    isOpen,
    onClose,
    initialFocusRef: closeButtonRef
  });

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const upcomingEvents = useMemo(() => {
    return getUpcomingEvents(chileNow, {
      marketId: selectedMarketId === 'all' ? undefined : selectedMarketId,
      minImportance: onlyHighImportance ? 'high' : undefined,
      maxDaysAhead: 120
    });
  }, [chileNow, selectedMarketId, onlyHighImportance]);

  const upcomingHolidays = useMemo(() => {
    return getUpcomingHolidays(chileNow, {
      marketId: selectedMarketId === 'all' ? undefined : selectedMarketId,
      maxDaysAhead: 120
    });
  }, [chileNow, selectedMarketId]);

  const marketTabs = useMemo(() => {
    return [
      { id: 'all', name: 'Todos', flag: '🌐' },
      ...MARKETS.map((m) => ({ id: m.id, name: m.name, flag: m.flag })),
      { id: CHILE_CONFIG.id, name: CHILE_CONFIG.name.split(' ')[0], flag: CHILE_CONFIG.flag }
    ];
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Drawer Container */}
          <motion.div
            ref={drawerRef}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="events-drawer-title"
            aria-describedby="events-drawer-desc"
            className="relative z-10 flex flex-col w-full max-w-md h-full bg-popover border-l border-border shadow-neon-lg overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-border bg-popover">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.04] border border-border text-zinc-200">
                  <Calendar className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <h2 id="events-drawer-title" className="text-sm font-semibold text-zinc-100 tracking-tight">
                    Próximos Eventos
                  </h2>
                  <p id="events-drawer-desc" className="text-[11px] text-muted-foreground">
                    Catalizadores macro y eventos clave
                  </p>
                </div>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                className="flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-white hover:bg-white/[0.06] transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 cursor-pointer"
                aria-label="Cerrar panel de eventos"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            {/* Filter Bar */}
            <div className="p-3 bg-popover border-b border-border space-y-2.5">
              {/* Mode Segmented Control: Eventos Macro vs Feriados Bursátiles */}
              <div className="grid grid-cols-2 p-0.5 bg-muted rounded-lg border border-border text-xs font-medium" role="group" aria-label="Modo de visualización de eventos">
                <button
                  type="button"
                  onClick={() => setViewMode('events')}
                  aria-pressed={viewMode === 'events'}
                  className={cn(
                    'py-1.5 px-2 rounded-md text-center transition-colors duration-150 select-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400',
                    viewMode === 'events'
                      ? 'bg-card text-zinc-100 border border-border-strong font-semibold'
                      : 'text-muted-foreground hover:text-zinc-200 border border-transparent'
                  )}
                >
                  Eventos Macro ({upcomingEvents.length})
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('holidays')}
                  aria-pressed={viewMode === 'holidays'}
                  className={cn(
                    'py-1.5 px-2 rounded-md text-center transition-colors duration-150 select-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400',
                    viewMode === 'holidays'
                      ? 'bg-card text-zinc-100 border border-border-strong font-semibold'
                      : 'text-muted-foreground hover:text-zinc-200 border border-transparent'
                  )}
                >
                  Feriados ({upcomingHolidays.length})
                </button>
              </div>

              {/* Market Filter Chips with horizontal wheel scroll, drag-to-scroll, and edge fade cues */}
              <div className="relative" role="group" aria-label="Filtrar eventos por mercado">
                <div
                  ref={chipsContainerRef}
                  onWheel={handleChipsWheel}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUpOrLeave}
                  onMouseLeave={handleMouseUpOrLeave}
                  onScroll={checkScrollability}
                  className="flex items-center gap-1.5 overflow-x-auto pb-1 pr-6 scrollbar-none text-xs cursor-grab active:cursor-grabbing select-none"
                >
                  {marketTabs.map((tab) => {
                    const isActive = selectedMarketId === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        data-active={isActive ? 'true' : undefined}
                        onClick={() => {
                          if (hasDraggedRef.current) return;
                          onSelectMarketId(tab.id);
                        }}
                        aria-pressed={isActive}
                        className={cn(
                          'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors duration-150 select-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 shrink-0',
                          isActive
                            ? 'bg-white/[0.08] text-zinc-100 border border-border-strong font-semibold'
                            : 'bg-muted/50 text-muted-foreground border border-border hover:bg-muted hover:text-zinc-200'
                        )}
                      >
                        <span aria-hidden="true">{tab.flag}</span>
                        <span>{tab.name}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Left edge fade overlay when scrolled right */}
                {canScrollLeft && (
                  <div
                    className="pointer-events-none absolute left-0 top-0 bottom-1 w-8 bg-gradient-to-r from-popover to-transparent"
                    aria-hidden="true"
                  />
                )}

                {/* Right edge fade overlay when more items are to the right */}
                {canScrollRight && (
                  <div
                    className="pointer-events-none absolute right-0 top-0 bottom-1 w-8 bg-gradient-to-l from-popover to-transparent"
                    aria-hidden="true"
                  />
                )}
              </div>

              {/* Secondary filter info */}
              {viewMode === 'events' ? (
                <div className="flex items-center justify-between pt-0.5">
                  <span className="text-[11px] text-muted-foreground">
                    {upcomingEvents.length}{' '}
                    {upcomingEvents.length === 1 ? 'evento encontrado' : 'eventos encontrados'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setOnlyHighImportance((prev) => !prev)}
                    aria-pressed={onlyHighImportance}
                    className={cn(
                      'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400',
                      onlyHighImportance
                        ? 'bg-rose-500/15 border-rose-500/35 text-rose-300'
                        : 'bg-muted/50 border-border text-muted-foreground hover:text-zinc-200'
                    )}
                  >
                    <Flame className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Solo Alta Importancia</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between pt-0.5">
                  <span className="text-[11px] text-muted-foreground">
                    {upcomingHolidays.length}{' '}
                    {upcomingHolidays.length === 1 ? 'feriado próximo' : 'feriados próximos'}
                  </span>
                  <span className="text-[11px] font-mono text-violet-300/80 font-medium">
                    Ventana 120 días
                  </span>
                </div>
              )}
            </div>

            {/* Content List: Holidays or Macro Events */}
            {viewMode === 'holidays' ? (
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {upcomingHolidays.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-secondary text-muted-foreground/70 mb-3">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-medium text-foreground/80">
                      No hay feriados bursátiles programados
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1 max-w-xs">
                      No registramos feriados para el mercado seleccionado en la ventana de los próximos 120 días.
                    </p>
                  </div>
                ) : (
                  upcomingHolidays.map((holiday, idx) => (
                    <div
                      key={`${holiday.marketId}-${holiday.date}-${idx}`}
                      className="p-3 rounded-xl bg-card border border-border hover:border-border-strong transition-colors duration-150 flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-white/[0.04] text-zinc-200 border border-border">
                          <span>{holiday.marketFlag}</span>
                          <span>{holiday.marketName}</span>
                        </span>
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider font-mono',
                            holiday.relativeDays === 0
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/35'
                              : holiday.relativeDays === 1
                              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/35'
                              : 'bg-white/[0.04] text-muted-foreground border border-border'
                          )}
                        >
                          {holiday.relativeDescriptor}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-xs font-semibold text-zinc-100 leading-snug">
                          {holiday.name}
                        </h3>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1.5 border-t border-border">
                        <span className="font-mono text-zinc-300">{holiday.dateFormatted} ({holiday.date})</span>
                        <span className="text-[10px] font-medium text-violet-300 uppercase tracking-wider">
                          Mercado cerrado
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {upcomingEvents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-secondary text-muted-foreground/70 mb-3">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-medium text-foreground/80">
                      No hay eventos programados
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1 max-w-xs">
                      No encontramos eventos con los filtros actuales en la ventana de los próximos 120 días.
                    </p>
                  </div>
                ) : (
                upcomingEvents.map((ev) => {
                  const catInfo = CATEGORY_LABELS[ev.category] ?? {
                    label: ev.category,
                    icon: AlertCircle
                  };
                  const CatIcon = catInfo.icon;
                  const isHigh = ev.importance === 'high';

                  // Market info
                  const market =
                    MARKETS.find((m) => m.id === ev.marketId) ||
                    (ev.marketId === 'chile' ? CHILE_CONFIG : null);

                  return (
                    <div
                      key={ev.id}
                      className="group flex flex-col gap-2 p-3 rounded-xl bg-card border border-border hover:border-border-strong transition-colors duration-150"
                    >
                      {/* Top row: tags & badges */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-white/[0.04] text-zinc-200 border border-border">
                            <span>{market?.flag ?? '🌐'}</span>
                            <span>{market?.name ?? ev.marketId.toUpperCase()}</span>
                          </span>

                          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/[0.03] text-muted-foreground">
                            <CatIcon className="w-3 h-3" />
                            <span>{catInfo.label}</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              'px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider font-mono',
                              isHigh
                                ? 'bg-rose-500/15 text-rose-300 border border-rose-500/35'
                                : 'bg-amber-500/15 text-amber-300 border border-amber-500/35'
                            )}
                          >
                            {isHigh ? 'Alta' : 'Media'}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-white/[0.04] text-zinc-300 border border-border">
                            {ev.relativeTimeDescriptor}
                          </span>
                        </div>
                      </div>

                      {/* Title & description */}
                      <div>
                        <h3 className="text-xs font-semibold text-zinc-100 leading-snug">
                          {ev.title}
                        </h3>
                        {ev.description && (
                          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                            {ev.description}
                          </p>
                        )}
                      </div>

                      {/* Timestamps conversion grid */}
                      <div className="grid grid-cols-2 gap-2 mt-1 p-2 rounded-lg bg-muted border border-border text-[11px]">
                        <div>
                          <span className="text-[10px] uppercase font-semibold tracking-wider text-zinc-300 flex items-center gap-1">
                            <span>🇨🇱</span> Hora Chile
                          </span>
                          <span className="font-mono font-medium text-zinc-100 mt-0.5 block tabular-nums">
                            {ev.chileTimeFormatted}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground flex items-center gap-1">
                            <span>{market?.flag ?? '🌐'}</span> Hora Bolsa
                          </span>
                          <span className="font-mono font-medium text-zinc-300 mt-0.5 block tabular-nums">
                            {ev.exchangeTimeFormatted}
                          </span>
                        </div>
                      </div>

                      {/* Forecast / Previous metrics if available */}
                      {(ev.forecast || ev.previous) && (
                        <div className="flex items-center gap-4 text-[10px] text-muted-foreground pt-0.5 px-0.5">
                          {ev.forecast && (
                            <span>
                              <strong className="text-foreground/80">Previsto:</strong> {ev.forecast}
                            </span>
                          )}
                          {ev.previous && (
                            <span>
                              <strong className="text-foreground/80">Previo:</strong> {ev.previous}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-border bg-popover/90 text-[10px] text-muted-foreground flex items-center justify-between">
              <span>Sincronizado con IANA America/Santiago</span>
              <span className="font-mono">PWA Offline ready</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
