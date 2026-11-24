import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DateTime } from 'luxon';
import {
  AlertCircle,
  Briefcase,
  Building2,
  Calendar,
  Clock,
  DollarSign,
  Flame,
  TrendingUp,
  X
} from 'lucide-react';
import {
  AgendaKindFilter,
  AgendaTimeRange,
  EventCategory,
  UnifiedEventAgendaItem,
  UnifiedHolidayAgendaItem
} from '../core/types';
import { MARKETS, CHILE_CONFIG } from '../core/markets';
import { CHILE_TZ } from '../core/timezone';
import { getDataFreshnessStatus } from '../core/events';
import {
  buildMonthCalendarGrid,
  getRangeWindowLabel,
  getUnifiedAgendaItems,
  groupAgendaItemsByDate
} from '../core/agenda';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { AgendaMonthCalendar } from './agenda/AgendaMonthCalendar';
import { cn } from '../lib/utils';

interface EventsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMarketId: string;
  onSelectMarketId: (marketId: string) => void;
  chileNow: DateTime;
  initialKind?: AgendaKindFilter;
  initialRange?: AgendaTimeRange;
  initialFocusIsoDate?: string | null;
  openToken?: number;
}

const CATEGORY_LABELS: Record<
  EventCategory,
  { label: string; icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }> }
> = {
  central_bank: { label: 'Banco Central', icon: Building2 },
  inflation: { label: 'Inflación / IPC', icon: TrendingUp },
  gdp: { label: 'Actividad / PIB', icon: DollarSign },
  employment: { label: 'Empleo', icon: Briefcase },
  holidays: { label: 'Feriado bursátil', icon: Calendar }
};

const RANGE_OPTIONS: Array<{ id: AgendaTimeRange; label: string }> = [
  { id: 'week', label: 'Próx. 7 días' },
  { id: 'month', label: 'Mes' },
  { id: 'quarter', label: '90 días' }
];

function formatFocusedDateLabel(isoDate: string): string {
  const dt = DateTime.fromISO(isoDate, { zone: CHILE_TZ });
  if (!dt.isValid) return isoDate;
  const weekday = dt.toFormat('ccc', { locale: 'es' }).replace(/\./g, '');
  const month = dt.toFormat('LLL', { locale: 'es' }).replace(/\./g, '');
  const capWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
  const capMonth = month.charAt(0).toUpperCase() + month.slice(1);
  return `${capWeekday} ${dt.day} ${capMonth}`;
}

export const EventsDrawer: React.FC<EventsDrawerProps> = ({
  isOpen,
  onClose,
  selectedMarketId,
  onSelectMarketId,
  chileNow,
  initialKind,
  initialRange,
  initialFocusIsoDate,
  openToken = 0
}) => {
  const [range, setRange] = useState<AgendaTimeRange>(() => initialRange ?? 'week');
  const [kindFilter, setKindFilter] = useState<AgendaKindFilter>(() => initialKind ?? 'all');
  const [onlyHighImportance, setOnlyHighImportance] = useState(false);
  const [focusedIsoDate, setFocusedIsoDate] = useState<string | null>(
    () => initialFocusIsoDate ?? null
  );
  const [viewedMonth, setViewedMonth] = useState<{ year: number; month: number }>(() => {
    if (initialFocusIsoDate) {
      const parsed = DateTime.fromISO(initialFocusIsoDate, { zone: CHILE_TZ });
      if (parsed.isValid) return { year: parsed.year, month: parsed.month };
    }
    return { year: chileNow.year, month: chileNow.month };
  });

  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const chileNowRef = useRef(chileNow);
  chileNowRef.current = chileNow;
  const wasOpenRef = useRef(false);
  const prevOpenTokenRef = useRef(openToken);

  // Sync deep-link options only when drawer opens or openToken increments (never on 1-minute ticks)
  useEffect(() => {
    const justOpened = isOpen && !wasOpenRef.current;
    const tokenChanged = isOpen && openToken !== prevOpenTokenRef.current;
    wasOpenRef.current = isOpen;
    prevOpenTokenRef.current = openToken;

    if (!justOpened && !tokenChanged) return;

    const nextRange = initialRange ?? 'week';
    const nextKind = initialKind ?? 'all';
    const nextFocus = initialFocusIsoDate ?? null;

    setRange(nextRange);
    setKindFilter(nextKind);
    setFocusedIsoDate(nextFocus);
    if (nextKind === 'holidays') {
      setOnlyHighImportance(false);
    }

    if (nextFocus) {
      const parsed = DateTime.fromISO(nextFocus, { zone: CHILE_TZ });
      if (parsed.isValid) {
        setViewedMonth({ year: parsed.year, month: parsed.month });
        return;
      }
    }

    const nowRef = chileNowRef.current;
    setViewedMonth({ year: nowRef.year, month: nowRef.month });
  }, [isOpen, openToken, initialKind, initialRange, initialFocusIsoDate]);

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
    setTimeout(() => {
      hasDraggedRef.current = false;
    }, 0);
  };

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(checkScrollability, 100);
    window.addEventListener('resize', checkScrollability);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkScrollability);
    };
  }, [isOpen, checkScrollability]);

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

  useBodyScrollLock(isOpen);

  const effectiveOnlyHigh = kindFilter !== 'holidays' && onlyHighImportance;

  const handleSelectRange = useCallback((nextRange: AgendaTimeRange) => {
    setRange(nextRange);
    if (nextRange !== 'month') {
      setFocusedIsoDate(null);
    }
  }, []);

  const handlePrevMonth = useCallback(() => {
    setFocusedIsoDate(null);
    setViewedMonth((prev) => {
      const dt = DateTime.fromObject({ year: prev.year, month: prev.month, day: 1 }, { zone: CHILE_TZ }).minus({
        months: 1
      });
      return { year: dt.year, month: dt.month };
    });
  }, []);

  const handleNextMonth = useCallback(() => {
    setFocusedIsoDate(null);
    setViewedMonth((prev) => {
      const dt = DateTime.fromObject({ year: prev.year, month: prev.month, day: 1 }, { zone: CHILE_TZ }).plus({
        months: 1
      });
      return { year: dt.year, month: dt.month };
    });
  }, []);

  const handleJumpToCurrentMonth = useCallback(() => {
    const nowRef = chileNowRef.current;
    setFocusedIsoDate(null);
    setViewedMonth({ year: nowRef.year, month: nowRef.month });
  }, []);

  const handleSelectCalendarDate = useCallback((isoDate: string) => {
    setFocusedIsoDate((prev) => (prev === isoDate ? null : isoDate));
  }, []);

  // All items in active range (for Todo / Eventos / Feriados pill counts + feed)
  const allItemsInRange = useMemo(() => {
    return getUnifiedAgendaItems(chileNow, {
      range,
      viewedMonth: range === 'month' ? viewedMonth : undefined,
      marketId: selectedMarketId === 'all' ? undefined : selectedMarketId,
      kind: 'all',
      onlyHighImportance: effectiveOnlyHigh,
      includePastInCurrentMonth: range === 'month' && Boolean(focusedIsoDate)
    });
  }, [chileNow, range, viewedMonth, selectedMarketId, effectiveOnlyHigh, focusedIsoDate]);

  const rangeCounts = useMemo(() => {
    let eventsCount = 0;
    let holidaysCount = 0;
    for (const item of allItemsInRange) {
      if (item.kind === 'event') eventsCount += 1;
      else holidaysCount += 1;
    }
    return {
      all: allItemsInRange.length,
      events: eventsCount,
      holidays: holidaysCount
    };
  }, [allItemsInRange]);

  const visibleItems = useMemo(() => {
    return allItemsInRange.filter((item) => {
      if (kindFilter === 'events' && item.kind !== 'event') return false;
      if (kindFilter === 'holidays' && item.kind !== 'holiday') return false;
      if (focusedIsoDate && item.isoDate !== focusedIsoDate) return false;
      return true;
    });
  }, [allItemsInRange, kindFilter, focusedIsoDate]);

  const dayGroups = useMemo(() => {
    return groupAgendaItemsByDate(visibleItems, chileNow);
  }, [visibleItems, chileNow]);

  // Full month items (including past days) so the mini-calendar dots reflect every day of the viewed month
  const fullMonthItems = useMemo(() => {
    if (range !== 'month') return [];
    return getUnifiedAgendaItems(chileNow, {
      range: 'month',
      viewedMonth,
      marketId: selectedMarketId === 'all' ? undefined : selectedMarketId,
      kind: kindFilter,
      onlyHighImportance: effectiveOnlyHigh,
      includePastInCurrentMonth: true
    });
  }, [range, chileNow, viewedMonth, selectedMarketId, kindFilter, effectiveOnlyHigh]);

  const monthGrid = useMemo(() => {
    if (range !== 'month') return null;
    return buildMonthCalendarGrid(viewedMonth.year, viewedMonth.month, chileNow, fullMonthItems);
  }, [range, viewedMonth, chileNow, fullMonthItems]);

  const isViewingCurrentMonth =
    viewedMonth.year === chileNow.year && viewedMonth.month === chileNow.month;

  const rangeSubtitle = useMemo(() => {
    return getRangeWindowLabel(range, chileNow, viewedMonth);
  }, [range, chileNow, viewedMonth]);

  const freshness = useMemo(() => {
    return getDataFreshnessStatus(chileNow);
  }, [chileNow]);

  const marketTabs = useMemo(() => {
    const hasChileMarket = MARKETS.some((m) => m.id === CHILE_CONFIG.id);
    return [
      { id: 'all', name: 'Todos', flag: '🌐' },
      ...MARKETS.map((m) => ({ id: m.id, name: m.name, flag: m.flag })),
      ...(hasChileMarket
        ? []
        : [{ id: CHILE_CONFIG.id, name: CHILE_CONFIG.name.split(' ')[0], flag: CHILE_CONFIG.flag }])
    ];
  }, []);

  const hasNarrowingFilters =
    selectedMarketId !== 'all' || onlyHighImportance || kindFilter !== 'all' || Boolean(focusedIsoDate);

  const handleResetFilters = useCallback(() => {
    onSelectMarketId('all');
    setKindFilter('all');
    setOnlyHighImportance(false);
    setFocusedIsoDate(null);
  }, [onSelectMarketId]);

  const renderHolidayCard = (item: UnifiedHolidayAgendaItem) => {
    const isEarly = item.isEarlyClose;
    return (
      <div
        key={item.id}
        className={cn(
          'p-2.5 sm:p-3 rounded-xl border transition-colors duration-150 flex flex-col gap-1.5',
          isEarly
            ? 'border-amber-500/30 bg-amber-500/[0.06] hover:border-amber-500/45'
            : 'border-violet-500/30 bg-violet-500/[0.07] hover:border-violet-500/45'
        )}
      >
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold bg-white/[0.05] text-zinc-100 border border-border">
            <span aria-hidden="true">{item.marketFlag}</span>
            <span>{item.marketName}</span>
          </span>

          <span
            className={cn(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border',
              isEarly
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/35'
                : 'bg-violet-500/15 text-violet-300 border-violet-500/35'
            )}
          >
            {isEarly ? (
              <Clock className="w-3 h-3 text-amber-400 shrink-0" aria-hidden="true" />
            ) : (
              <Calendar className="w-3 h-3 text-violet-400 shrink-0" aria-hidden="true" />
            )}
            <span>{isEarly ? 'Cierre temprano' : 'Feriado bursátil'}</span>
          </span>
        </div>

        <h4 className="text-sm font-semibold text-zinc-100 leading-snug">
          {item.holiday.name}
        </h4>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span
            className={cn(
              'font-medium',
              isEarly ? 'text-amber-200/90' : 'text-violet-200/90'
            )}
          >
            {isEarly
              ? item.closeTimeChile
                ? `Cierra ${item.holiday.closeTime} local · ${item.closeTimeChile}`
                : `Cierra ${item.holiday.closeTime} local`
              : 'Mercado cerrado todo el día'}
          </span>
          <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
            {item.isoDate}
          </span>
        </div>
      </div>
    );
  };

  const renderEventCard = (item: UnifiedEventAgendaItem) => {
    const ev = item.event;
    const catInfo = CATEGORY_LABELS[ev.category] ?? {
      label: ev.category,
      icon: AlertCircle
    };
    const CatIcon = catInfo.icon;
    const isHigh = ev.importance === 'high';

    return (
      <div
        key={item.id}
        className="group flex flex-col gap-2 p-3 rounded-xl bg-card border border-border hover:border-border-strong transition-colors duration-150"
      >
        {/* Top row: market, category, impact */}
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-white/[0.04] text-zinc-200 border border-border">
              <span aria-hidden="true">{item.marketFlag}</span>
              <span>{item.marketName}</span>
            </span>

            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-white/[0.03] text-muted-foreground">
              <CatIcon className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{catInfo.label}</span>
            </span>
          </div>

          <span
            className={cn(
              'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-semibold whitespace-nowrap',
              isHigh
                ? 'bg-rose-500/15 text-rose-300 border border-rose-500/35'
                : 'bg-amber-500/15 text-amber-300 border border-amber-500/35'
            )}
          >
            {isHigh ? (
              <Flame className="w-3 h-3 text-rose-400 shrink-0" aria-hidden="true" />
            ) : (
              <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" aria-hidden="true" />
            )}
            <span>{isHigh ? 'Impacto alto' : 'Impacto medio'}</span>
          </span>
        </div>

        {/* Title & description */}
        <div>
          <h4 className="text-sm font-semibold text-zinc-100 leading-snug">
            {ev.title}
          </h4>
          {ev.description && (
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              {ev.description}
            </p>
          )}
        </div>

        {/* Timestamps conversion grid */}
        <div className="grid grid-cols-2 gap-2 p-2 rounded-lg bg-muted border border-border text-xs">
          <div>
            <span className="text-[11px] uppercase font-semibold tracking-wider text-zinc-300 flex items-center gap-1">
              <span aria-hidden="true">🇨🇱</span> Hora Chile
            </span>
            <span className="font-mono font-medium text-zinc-100 mt-0.5 block tabular-nums">
              {ev.chileTimeFormatted}
            </span>
          </div>
          <div>
            <span className="text-[11px] uppercase font-semibold tracking-wider text-muted-foreground flex items-center gap-1">
              <span aria-hidden="true">{item.marketFlag}</span> Hora local
            </span>
            <span className="font-mono font-medium text-zinc-300 mt-0.5 block tabular-nums">
              {ev.exchangeTimeFormatted}
            </span>
          </div>
        </div>

        {/* Forecast / Previous metrics if available */}
        {(ev.forecast || ev.previous) && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground pt-0.5 px-0.5">
            {ev.forecast && (
              <span>
                <strong className="text-foreground/80">Pronóstico:</strong> {ev.forecast}
              </span>
            )}
            {ev.previous && (
              <span>
                <strong className="text-foreground/80">Anterior:</strong> {ev.previous}
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div key="events-drawer-overlay" className="fixed inset-0 z-50 flex justify-end">
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
            exit={{ x: '100%', transition: { duration: 0.2, ease: 'easeIn' } }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="events-drawer-title"
            aria-describedby="events-drawer-desc"
            className="relative z-10 flex flex-col w-full max-w-lg h-full bg-popover border-l border-border shadow-neon-lg overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-popover">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.04] border border-border text-zinc-200 shrink-0">
                  <Calendar className="w-4 h-4" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <h2 id="events-drawer-title" className="text-sm font-semibold text-zinc-100 tracking-tight truncate">
                    Agenda de Mercados
                  </h2>
                  <p id="events-drawer-desc" className="text-xs text-muted-foreground truncate">
                    {rangeSubtitle} · Eventos y feriados
                  </p>
                </div>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                className="relative flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:text-white hover:bg-white/[0.06] transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 cursor-pointer shrink-0 before:absolute before:-inset-1.5 before:content-['']"
                aria-label="Cerrar agenda de mercados"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            {/* Filter Bar */}
            <div className="p-3 bg-popover border-b border-border space-y-2">
              {/* Row 1: Temporal Range Segmented Control */}
              <div
                className="grid grid-cols-3 p-0.5 bg-muted rounded-lg border border-border text-xs font-medium"
                role="group"
                aria-label="Rango temporal"
              >
                {RANGE_OPTIONS.map((option) => {
                  const isActive = range === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleSelectRange(option.id)}
                      aria-pressed={isActive}
                      className={cn(
                        'min-h-[36px] py-1.5 px-2 rounded-md text-center transition-colors duration-150 select-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400',
                        isActive
                          ? 'bg-card text-zinc-100 border border-border-strong font-semibold'
                          : 'text-muted-foreground hover:text-zinc-200 border border-transparent'
                      )}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>

              {/* Row 2: Kind filter pills + High importance toggle */}
              <div className="flex items-center justify-between gap-1.5 flex-wrap">
                <div className="flex items-center gap-1 flex-wrap" role="group" aria-label="Tipo de registro">
                  {(
                    [
                      { id: 'all', label: 'Todo', count: rangeCounts.all },
                      { id: 'events', label: 'Eventos', count: rangeCounts.events },
                      { id: 'holidays', label: 'Feriados', count: rangeCounts.holidays }
                    ] as const
                  ).map((pill) => {
                    const isActive = kindFilter === pill.id;
                    return (
                      <button
                        key={pill.id}
                        type="button"
                        onClick={() => setKindFilter(pill.id)}
                        aria-pressed={isActive}
                        className={cn(
                          'inline-flex items-center gap-1 min-h-[34px] px-2.5 py-1 rounded-md text-xs font-medium border transition-colors duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400',
                          isActive
                            ? pill.id === 'holidays'
                              ? 'bg-violet-500/15 border-violet-500/35 text-violet-200 font-semibold'
                              : 'bg-white/[0.08] border-border-strong text-zinc-100 font-semibold'
                            : 'bg-muted/50 border-border text-muted-foreground hover:text-zinc-200'
                        )}
                      >
                        <span>{pill.label}</span>
                        <span className="font-mono text-[11px] opacity-80 tabular-nums">({pill.count})</span>
                      </button>
                    );
                  })}
                </div>

                {kindFilter !== 'holidays' && (
                  <button
                    type="button"
                    onClick={() => setOnlyHighImportance((prev) => !prev)}
                    aria-pressed={onlyHighImportance}
                    title="Solo eventos macro de impacto alto"
                    className={cn(
                      'inline-flex items-center gap-1 min-h-[34px] px-2.5 py-1 rounded-md text-xs font-medium border transition-colors duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 shrink-0',
                      onlyHighImportance
                        ? 'bg-rose-500/15 border-rose-500/35 text-rose-300 font-semibold'
                        : 'bg-muted/50 border-border text-muted-foreground hover:text-zinc-200'
                    )}
                  >
                    <Flame className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Alto</span>
                  </button>
                )}
              </div>

              {/* Row 3: Market Filter Chips */}
              <div className="relative" role="group" aria-label="Filtrar agenda por mercado">
                <div
                  ref={chipsContainerRef}
                  onWheel={handleChipsWheel}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUpOrLeave}
                  onMouseLeave={handleMouseUpOrLeave}
                  onScroll={checkScrollability}
                  className="flex items-center gap-1.5 overflow-x-auto pb-0.5 pr-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden text-xs cursor-grab active:cursor-grabbing select-none"
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
                          'flex items-center gap-1.5 min-h-[36px] px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-colors duration-150 select-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 shrink-0',
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

                {canScrollLeft && (
                  <div
                    className="pointer-events-none absolute left-0 top-0 bottom-0.5 w-8 bg-gradient-to-r from-popover to-transparent"
                    aria-hidden="true"
                  />
                )}

                {canScrollRight && (
                  <div
                    className="pointer-events-none absolute right-0 top-0 bottom-0.5 w-8 bg-gradient-to-l from-popover to-transparent"
                    aria-hidden="true"
                  />
                )}
              </div>
            </div>

            {/* Stale Data Warning Banner if coverage window is close to expiry */}
            {freshness.isStale && freshness.message && (
              <div className="mx-3 mt-2.5 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-start gap-2 text-xs text-amber-200">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
                <span className="leading-snug">{freshness.message}</span>
              </div>
            )}

            {/* Main Scrollable Agenda Feed */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {range === 'month' && monthGrid && (
                <AgendaMonthCalendar
                  grid={monthGrid}
                  focusedIsoDate={focusedIsoDate}
                  isCurrentMonth={isViewingCurrentMonth}
                  onSelectDate={handleSelectCalendarDate}
                  onPrevMonth={handlePrevMonth}
                  onNextMonth={handleNextMonth}
                  onJumpToCurrentMonth={handleJumpToCurrentMonth}
                />
              )}

              {focusedIsoDate && (
                <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border border-sky-500/30 bg-sky-500/10 text-xs">
                  <span className="text-sky-200 font-medium truncate">
                    Mostrando: <strong className="text-white">{formatFocusedDateLabel(focusedIsoDate)}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setFocusedIsoDate(null)}
                    className="px-2 py-0.5 rounded-md bg-white/[0.08] hover:bg-white/[0.14] text-zinc-100 font-medium transition-colors cursor-pointer shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                  >
                    Ver todo
                  </button>
                </div>
              )}

              {dayGroups.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-secondary text-muted-foreground mb-3">
                    <Calendar className="w-6 h-6" aria-hidden="true" />
                  </div>
                  <p className="text-sm font-medium text-foreground/85">
                    Sin eventos ni feriados en este rango
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                    {focusedIsoDate
                      ? 'No hay actividad registrada para la fecha seleccionada con los filtros actuales.'
                      : 'Prueba ampliar el horizonte temporal o ajustar los filtros de mercado.'}
                  </p>

                  <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                    {range === 'week' && !focusedIsoDate && (
                      <button
                        type="button"
                        onClick={() => handleSelectRange('month')}
                        className="px-3 py-1.5 rounded-lg border border-sky-500/35 bg-sky-500/12 hover:bg-sky-500/20 text-xs font-semibold text-sky-200 transition-colors cursor-pointer"
                      >
                        Ver este mes
                      </button>
                    )}
                    {range === 'month' && !focusedIsoDate && (
                      <button
                        type="button"
                        onClick={() => handleSelectRange('quarter')}
                        className="px-3 py-1.5 rounded-lg border border-sky-500/35 bg-sky-500/12 hover:bg-sky-500/20 text-xs font-semibold text-sky-200 transition-colors cursor-pointer"
                      >
                        Ver próximos 90 días
                      </button>
                    )}
                    {hasNarrowingFilters && (
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="px-3 py-1.5 rounded-lg border border-border bg-white/[0.04] hover:bg-white/[0.08] text-xs font-medium text-zinc-200 transition-colors cursor-pointer"
                      >
                        Limpiar filtros
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {dayGroups.map((group) => (
                    <section key={group.isoDate} aria-label={group.dayLabel} className="space-y-2">
                      {/* Sticky day header */}
                      <div className="sticky top-0 z-10 bg-popover/95 backdrop-blur-md border-b border-border/70 py-1.5 px-1 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <h3 className="text-xs font-semibold text-zinc-100 tracking-tight truncate">
                            {group.dayLabel}
                          </h3>
                          <span className="text-[11px] font-mono text-muted-foreground tabular-nums">
                            {group.totalCount}
                          </span>
                        </div>

                        <span
                          className={cn(
                            'px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider shrink-0 border',
                            group.relativeDays === 0
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35'
                              : group.relativeDays === 1
                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/35'
                              : 'bg-white/[0.04] text-muted-foreground border-border'
                          )}
                        >
                          {group.relativeDescriptor}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {group.holidays.map(renderHolidayCard)}
                        {group.events.map(renderEventCard)}
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </div>

            {/* Footer with iOS PWA safe-area-inset-bottom support */}
            <div className="px-4 pt-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] border-t border-border bg-popover/90 text-xs text-muted-foreground">
              <span>Horarios ajustados automáticamente · Referencia: Santiago, Chile</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
