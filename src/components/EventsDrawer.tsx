import React, { useEffect, useMemo, useRef, useState } from 'react';
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
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-border bg-popover/90 backdrop-blur-md">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/[0.15] border border-emerald-400/45 text-emerald-300 shadow-[0_0_0_1px_rgba(16,185,129,0.18),0_0_18px_-6px_rgba(16,185,129,0.55)]">
                  <Calendar className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <h2 id="events-drawer-title" className="text-sm font-semibold text-white tracking-wide">
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
                className="flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:text-white hover:bg-white/5 active:bg-white/10 transition-[color,background-color,border-color,box-shadow] duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                aria-label="Cerrar panel de eventos"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Filter Bar */}
            <div className="p-3 bg-popover/90 border-b border-border space-y-2.5">
              {/* Mode Segmented Control: Eventos Macro vs Feriados Bursátiles */}
              <div className="grid grid-cols-2 p-1 bg-white/[0.04] rounded-lg border border-border text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setViewMode('events')}
                  className={cn(
                    'py-1.5 px-2 rounded-md text-center transition-all duration-200 select-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400',
                    viewMode === 'events'
                      ? 'bg-emerald-500/[0.18] text-emerald-300 border border-emerald-400/45 shadow-[0_0_0_1px_rgba(16,185,129,0.18),0_0_12px_-4px_rgba(16,185,129,0.5)]'
                      : 'text-muted-foreground hover:text-white'
                  )}
                >
                  Eventos Macro ({upcomingEvents.length})
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('holidays')}
                  className={cn(
                    'py-1.5 px-2 rounded-md text-center transition-all duration-200 select-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400',
                    viewMode === 'holidays'
                      ? 'bg-purple-500/[0.18] text-purple-300 border border-purple-400/45 shadow-[0_0_0_1px_rgba(168,85,247,0.18),0_0_12px_-4px_rgba(168,85,247,0.5)]'
                      : 'text-muted-foreground hover:text-white'
                  )}
                >
                  Feriados ({upcomingHolidays.length})
                </button>
              </div>

              {/* Market Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                {marketTabs.map((tab) => {
                  const isActive = selectedMarketId === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => onSelectMarketId(tab.id)}
                      className={cn(
                        'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-medium whitespace-nowrap transition-[color,background-color,border-color,box-shadow] duration-200 select-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400',
                        isActive
                          ? 'bg-emerald-500/[0.15] text-emerald-300 border border-emerald-400/45 shadow-[0_0_0_1px_rgba(16,185,129,0.18),0_0_18px_-6px_rgba(16,185,129,0.55)]'
                          : 'bg-white/[0.05] text-muted-foreground border border-border hover:bg-white/[0.08] hover:text-foreground/80'
                      )}
                    >
                      <span aria-hidden="true">{tab.flag}</span>
                      <span>{tab.name}</span>
                    </button>
                  );
                })}
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
                    className={cn(
                      'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border transition-[color,background-color,border-color,box-shadow] duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400',
                      onlyHighImportance
                        ? 'bg-rose-500/[0.15] border-rose-400/45 text-rose-300 shadow-[0_0_0_1px_rgba(244,63,94,0.18),0_0_18px_-6px_rgba(244,63,94,0.55)]'
                        : 'bg-white/[0.05] border-border text-muted-foreground hover:text-foreground/80'
                    )}
                  >
                    <Flame className="w-3.5 h-3.5" />
                    <span>Solo Alta Importancia</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between pt-0.5">
                  <span className="text-[11px] text-muted-foreground">
                    {upcomingHolidays.length}{' '}
                    {upcomingHolidays.length === 1 ? 'feriado próximo' : 'feriados próximos'}
                  </span>
                  <span className="text-[11px] font-mono text-purple-300/80 font-medium">
                    Ventana 120 días
                  </span>
                </div>
              )}
            </div>

            {/* Content List: Holidays or Macro Events */}
            {viewMode === 'holidays' ? (
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
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
                      className="p-3 rounded-xl bg-white/[0.03] border border-purple-500/25 hover:border-purple-400/40 hover:bg-purple-950/20 transition-[background-color,border-color] duration-200 flex flex-col gap-2 shadow-[0_2px_8px_rgba(0,0,0,0.3)]"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-white/[0.05] text-foreground/90 border border-border">
                          <span>{holiday.marketFlag}</span>
                          <span>{holiday.marketName}</span>
                        </span>
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider',
                            holiday.relativeDays === 0
                              ? 'bg-emerald-500/[0.15] text-emerald-300 border border-emerald-400/45 shadow-[0_0_0_1px_rgba(16,185,129,0.18),0_0_12px_-4px_rgba(16,185,129,0.5)] animate-pulse'
                              : holiday.relativeDays === 1
                              ? 'bg-amber-500/[0.15] text-amber-300 border border-amber-400/45'
                              : 'bg-white/[0.05] text-muted-foreground border border-border'
                          )}
                        >
                          {holiday.relativeDescriptor}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-xs font-bold text-purple-200 leading-snug">
                          {holiday.name}
                        </h3>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1.5 border-t border-purple-500/15">
                        <span className="font-mono text-foreground/80">{holiday.dateFormatted} ({holiday.date})</span>
                        <span className="text-[10px] font-semibold text-purple-300/90 uppercase tracking-wider">
                          Mercado cerrado
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5 divide-y divide-border">
                {upcomingEvents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-secondary text-muted-foreground/70 mb-3">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-medium text-foreground/80">
                      No hay eventos programados
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1 max-w-xs">
                      No encontramos eventos con los filtros actuales en la ventana de los próximos 30 días.
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
                      className="pt-2.5 first:pt-0 group flex flex-col gap-2 p-3 rounded-xl bg-white/[0.03] border border-border hover:border-border-strong hover:bg-white/[0.06] transition-[background-color,border-color] duration-200"
                    >
                      {/* Top row: tags & badges */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-white/[0.05] text-foreground/80 border border-border">
                            <span>{market?.flag ?? '🌐'}</span>
                            <span>{market?.name ?? ev.marketId.toUpperCase()}</span>
                          </span>

                          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/[0.05] text-muted-foreground">
                            <CatIcon className="w-3 h-3" />
                            <span>{catInfo.label}</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              'px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider',
                              isHigh
                                ? 'bg-rose-500/[0.15] text-rose-300 border border-rose-400/45 shadow-[0_0_0_1px_rgba(244,63,94,0.18),0_0_18px_-6px_rgba(244,63,94,0.55)]'
                                : 'bg-amber-500/[0.15] text-amber-300 border border-amber-400/45 shadow-[0_0_0_1px_rgba(245,158,11,0.18),0_0_18px_-6px_rgba(245,158,11,0.55)]'
                            )}
                          >
                            {isHigh ? 'Alta' : 'Media'}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/[0.15] text-emerald-300 border border-emerald-400/45 shadow-[0_0_0_1px_rgba(16,185,129,0.18),0_0_18px_-6px_rgba(16,185,129,0.55)]">
                            {ev.relativeTimeDescriptor}
                          </span>
                        </div>
                      </div>

                      {/* Title & description */}
                      <div>
                        <h3 className="text-xs font-semibold text-white leading-snug">
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
                          <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-300 flex items-center gap-1">
                            <span>🇨🇱</span> Hora Chile
                          </span>
                          <span className="font-mono font-medium text-foreground/80 mt-0.5 block">
                            {ev.chileTimeFormatted}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1">
                            <span>{market?.flag ?? '🌐'}</span> Hora Bolsa
                          </span>
                          <span className="font-mono font-medium text-foreground/80 mt-0.5 block">
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
