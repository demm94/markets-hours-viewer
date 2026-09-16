import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DateTime } from 'luxon';
import { X, Calendar, Flame, AlertCircle, Building2, TrendingUp, DollarSign } from 'lucide-react';
import { EventCategory } from '../core/types';
import { MARKETS, CHILE_CONFIG } from '../core/markets';
import { getUpcomingEvents } from '../core/events';
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
  const [onlyHighImportance, setOnlyHighImportance] = useState(false);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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
      maxDaysAhead: 30
    });
  }, [chileNow, selectedMarketId, onlyHighImportance]);

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
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Drawer Container */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="relative z-10 flex flex-col w-full max-w-md h-full bg-slate-900 border-l border-white/10 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/10 bg-slate-900/90 backdrop-blur-md">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white tracking-wide">
                    Próximos Eventos
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Catalizadores macro y eventos clave
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex items-center justify-center w-9 h-9 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 active:bg-white/10 transition-colors"
                aria-label="Cerrar panel de eventos"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Bar */}
            <div className="p-3 bg-slate-900/50 border-b border-white/5 space-y-2.5">
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
                        'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-medium whitespace-nowrap transition-all select-none',
                        isActive
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                          : 'bg-slate-800/80 text-slate-400 border border-white/5 hover:bg-slate-800 hover:text-slate-200'
                      )}
                    >
                      <span>{tab.flag}</span>
                      <span>{tab.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Toggle High Importance */}
              <div className="flex items-center justify-between pt-0.5">
                <span className="text-[11px] text-slate-400">
                  {upcomingEvents.length}{' '}
                  {upcomingEvents.length === 1 ? 'evento encontrado' : 'eventos encontrados'}
                </span>
                <button
                  type="button"
                  onClick={() => setOnlyHighImportance((prev) => !prev)}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors',
                    onlyHighImportance
                      ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                      : 'bg-slate-800/60 border-white/5 text-slate-400 hover:text-slate-300'
                  )}
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>Solo Alta Importancia</span>
                </button>
              </div>
            </div>

            {/* Events List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 divide-y divide-white/5">
              {upcomingEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-800/80 text-slate-500 mb-3">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-medium text-slate-300">
                    No hay eventos programados
                  </p>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs">
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
                      className="pt-2.5 first:pt-0 group flex flex-col gap-2 p-3 rounded-xl bg-slate-800/40 border border-white/5 hover:border-white/10 hover:bg-slate-800/70 transition-all"
                    >
                      {/* Top row: tags & badges */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-700/60 text-slate-300 border border-white/5">
                            <span>{market?.flag ?? '🌐'}</span>
                            <span>{market?.name ?? ev.marketId.toUpperCase()}</span>
                          </span>

                          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-400">
                            <CatIcon className="w-3 h-3" />
                            <span>{catInfo.label}</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              'px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider',
                              isHigh
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : 'bg-amber-500/15 text-amber-300 border border-amber-500/25'
                            )}
                          >
                            {isHigh ? 'Alta' : 'Media'}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-950/40 text-emerald-400 border border-emerald-500/20">
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
                          <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                            {ev.description}
                          </p>
                        )}
                      </div>

                      {/* Timestamps conversion grid */}
                      <div className="grid grid-cols-2 gap-2 mt-1 p-2 rounded-lg bg-slate-900/70 border border-white/5 text-[11px]">
                        <div>
                          <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 flex items-center gap-1">
                            <span>🇨🇱</span> Hora Chile
                          </span>
                          <span className="font-mono font-medium text-slate-200 mt-0.5 block">
                            {ev.chileTimeFormatted}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1">
                            <span>{market?.flag ?? '🌐'}</span> Hora Bolsa
                          </span>
                          <span className="font-mono font-medium text-slate-300 mt-0.5 block">
                            {ev.exchangeTimeFormatted}
                          </span>
                        </div>
                      </div>

                      {/* Forecast / Previous metrics if available */}
                      {(ev.forecast || ev.previous) && (
                        <div className="flex items-center gap-4 text-[10px] text-slate-400 pt-0.5 px-0.5">
                          {ev.forecast && (
                            <span>
                              <strong className="text-slate-300">Previsto:</strong> {ev.forecast}
                            </span>
                          )}
                          {ev.previous && (
                            <span>
                              <strong className="text-slate-300">Previo:</strong> {ev.previous}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-white/10 bg-slate-900/90 text-[10px] text-slate-400 flex items-center justify-between">
              <span>Sincronizado con IANA America/Santiago</span>
              <span className="font-mono">PWA Offline ready</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
