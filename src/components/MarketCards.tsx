import React from 'react';
import { motion, type Variants } from 'framer-motion';
import { DateTime } from 'luxon';
import { Calendar, ChevronRight } from 'lucide-react';
import { MarketConfig, MarketEvaluation, MarketTransition } from '../core/types';
import { CHILE_TZ, formatMarketChileSchedule } from '../core/timezone';
import { badgeVariants } from './ui/badge';
import { cn } from '../lib/utils';

interface MarketCardsProps {
  markets: MarketConfig[];
  evaluations: Record<string, MarketEvaluation>;
  onSelectMarketEvents: (marketId: string) => void;
  catalystsMap?: Record<string, boolean>;
  referenceDate?: DateTime;
  // Optional compatibility props kept until App.tsx cleanup (T4)
  notificationsEnabled?: boolean;
  subscribedMarketIds?: string[];
  onToggleMarketAlert?: (marketId: string) => void;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04
    }
  }
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 10, scale: 0.99 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 350,
      damping: 26
    }
  }
};

function formatTransitionLine(transition?: MarketTransition): string | null {
  if (!transition?.formattedCountdown) return null;
  const countdown = transition.formattedCountdown;
  const atChile = transition.atChileFormatted?.trim();

  if (atChile && !countdown.includes(atChile)) {
    return `${countdown} · ${atChile}`;
  }

  return countdown;
}

function getMarketVisualState(ev?: MarketEvaluation) {
  const status = ev?.status ?? 'closed';
  const isFullHoliday = Boolean(ev?.holiday && !ev.holiday.isEarlyClose);

  if (isFullHoliday) {
    return {
      badgeVariant: 'holiday' as const,
      statusText: 'Feriado',
      cardStateClass:
        'border-violet-500/30 bg-gradient-to-b from-violet-500/[0.05] to-card hover:border-violet-500/50'
    };
  }

  if (status === 'open') {
    return {
      badgeVariant: 'open' as const,
      statusText: 'Abierto',
      cardStateClass:
        'border-emerald-500/30 bg-gradient-to-b from-emerald-500/[0.05] to-card hover:border-emerald-500/50'
    };
  }

  if (status === 'lunch') {
    return {
      badgeVariant: 'lunch' as const,
      statusText: 'Almuerzo',
      cardStateClass:
        'border-amber-500/30 bg-gradient-to-b from-amber-500/[0.05] to-card hover:border-amber-500/50'
    };
  }

  if (status === 'pre_market') {
    return {
      badgeVariant: 'pre' as const,
      statusText: 'Pre-apertura',
      cardStateClass:
        'border-sky-500/30 bg-gradient-to-b from-sky-500/[0.05] to-card hover:border-sky-500/50'
    };
  }

  return {
    badgeVariant: 'closed' as const,
    statusText: 'Cerrado',
    cardStateClass: 'border-border bg-card hover:border-border-strong'
  };
}

export const MarketCards: React.FC<MarketCardsProps> = React.memo(({
  markets,
  evaluations,
  onSelectMarketEvents,
  catalystsMap,
  referenceDate
}) => {
  const effectiveReferenceDate = referenceDate ?? DateTime.now().setZone(CHILE_TZ);

  const items = markets.map((market) => {
    const ev = evaluations[market.id];
    const schedule = formatMarketChileSchedule(market, effectiveReferenceDate);
    const transitionLine = formatTransitionLine(ev?.nextTransition);
    const hasCatalyst = Boolean(catalystsMap?.[market.id]);
    const visual = getMarketVisualState(ev);
    const holidayLabel = ev?.holiday
      ? ev.holiday.isEarlyClose
        ? `Cierre temprano · ${ev.holiday.name}`
        : ev.holiday.name
      : null;

    const ariaParts = [
      `${market.name} (${market.code})`,
      visual.statusText,
      holidayLabel,
      `Horario Chile ${schedule.summary}`,
      transitionLine,
      ev?.localTimeFormatted
        ? `Hora local ${ev.localTimeFormatted}${ev.localDateFormatted ? ` ${ev.localDateFormatted}` : ''}`
        : null,
      hasCatalyst ? 'Evento hoy' : null,
      'Abrir agenda del mercado'
    ].filter(Boolean);

    return {
      market,
      ev,
      schedule,
      transitionLine,
      hasCatalyst,
      holidayLabel,
      ariaLabel: ariaParts.join(', '),
      ...visual
    };
  });

  return (
    <>
      {/* Mobile Scannable Vertical Rows (<md) */}
      <div className="flex flex-col gap-1.5 md:hidden">
        {items.map(
          ({
            market,
            ev,
            schedule,
            transitionLine,
            hasCatalyst,
            holidayLabel,
            badgeVariant,
            statusText,
            cardStateClass,
            ariaLabel
          }) => {
            const shortCode = market.code.split(' ')[0];

            return (
              <button
                type="button"
                key={market.id}
                onClick={() => onSelectMarketEvents(market.id)}
                title={market.notes}
                aria-label={ariaLabel}
                className={cn(
                  'group relative flex items-center justify-between gap-2.5 w-full rounded-xl border px-3 py-2.5 text-left backdrop-blur-md text-card-foreground shadow-neon transition-colors duration-150 cursor-pointer active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400',
                  cardStateClass
                )}
              >
                {/* Left: Identity, status, holiday/early-close tag & catalyst cue */}
                <span className="flex flex-col gap-1.5 min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-base leading-none select-none shrink-0" aria-hidden="true">
                      {market.flag}
                    </span>
                    <span className="text-sm font-semibold text-zinc-100 tracking-tight leading-tight">
                      {market.name}
                    </span>
                    <span className="text-[11px] font-mono font-medium text-muted-foreground uppercase tracking-wider leading-none sm:hidden">
                      {shortCode}
                    </span>
                    <span className="hidden sm:inline text-[11px] font-mono font-medium text-muted-foreground uppercase tracking-wider leading-none">
                      {market.code}
                    </span>
                  </span>

                  <span className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={cn(
                        badgeVariants({ variant: badgeVariant }),
                        'px-2 py-0.5 text-[11px]'
                      )}
                    >
                      <span
                        className={cn(
                          'h-1.5 w-1.5 rounded-full bg-current',
                          badgeVariant === 'open' && 'animate-pulse'
                        )}
                        aria-hidden="true"
                      />
                      {statusText}
                    </span>

                    {ev?.holiday && holidayLabel && (
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-medium leading-snug',
                          ev.holiday.isEarlyClose
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                            : 'bg-violet-500/10 border-violet-500/30 text-violet-200'
                        )}
                      >
                        <Calendar
                          className={cn(
                            'w-3 h-3 shrink-0',
                            ev.holiday.isEarlyClose ? 'text-amber-400' : 'text-violet-400'
                          )}
                          aria-hidden="true"
                        />
                        <span>{holidayLabel}</span>
                      </span>
                    )}

                    {hasCatalyst && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/25 text-[10px] font-medium text-rose-300 leading-none">
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0"
                          aria-hidden="true"
                        />
                        <span>Evento hoy</span>
                      </span>
                    )}
                  </span>
                </span>

                {/* Right: Primary Chile schedule, countdown, subtle local clock & affordance */}
                <span className="flex items-center gap-2 shrink-0 text-right max-w-[54%]">
                  <span className="flex flex-col items-end gap-0.5 min-w-0">
                    <span className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground leading-none">
                      Horario Chile
                    </span>
                    <span
                      className={cn(
                        'font-mono text-xs sm:text-sm font-bold tabular-nums tracking-tight leading-snug',
                        schedule.isHoliday ? 'text-violet-200' : 'text-zinc-100'
                      )}
                    >
                      {schedule.summary}
                    </span>
                    {transitionLine && (
                      <span className="font-mono text-[11px] font-medium text-zinc-300 tabular-nums leading-snug">
                        {transitionLine}
                      </span>
                    )}
                    <span className="font-mono text-[10px] text-muted-foreground tabular-nums leading-tight">
                      Local {ev?.localTimeFormatted ?? '--:--'}
                      {ev?.localDateFormatted ? ` · ${ev.localDateFormatted}` : ''}
                    </span>
                  </span>

                  <ChevronRight
                    className="w-4 h-4 text-muted-foreground/70 group-hover:text-zinc-200 group-hover:translate-x-0.5 transition-all shrink-0"
                    aria-hidden="true"
                  />
                </span>
              </button>
            );
          }
        )}
      </div>

      {/* Desktop Spacious Clickable Cards (md+) */}
      <motion.div
        className="hidden md:grid md:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-3.5"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {items.map(
          ({
            market,
            ev,
            schedule,
            transitionLine,
            hasCatalyst,
            holidayLabel,
            badgeVariant,
            statusText,
            cardStateClass,
            ariaLabel
          }) => {
            const isSplitSchedule = schedule.summary.includes(' · ') && !schedule.isHoliday;

            return (
              <motion.div key={market.id} variants={cardVariants} layout className="h-full">
                <button
                  type="button"
                  onClick={() => onSelectMarketEvents(market.id)}
                  title={market.notes}
                  aria-label={ariaLabel}
                  className={cn(
                    'group relative w-full h-full rounded-xl border p-3.5 sm:p-4 flex flex-col justify-between gap-3 text-left backdrop-blur-md text-card-foreground shadow-neon transition-colors duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400',
                    cardStateClass
                  )}
                >
                  {/* Row 1: Identity on left, status badge on right */}
                  <span className="flex items-start justify-between gap-2 w-full">
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="text-lg leading-none select-none shrink-0" aria-hidden="true">
                        {market.flag}
                      </span>
                      <span className="min-w-0 block">
                        <span className="block text-sm font-semibold text-zinc-100 tracking-tight leading-tight truncate">
                          {market.name}
                        </span>
                        <span className="block text-[11px] font-mono font-medium text-muted-foreground tracking-wider uppercase mt-0.5 truncate">
                          {market.code}
                        </span>
                      </span>
                    </span>

                    <span
                      className={cn(
                        badgeVariants({ variant: badgeVariant }),
                        'px-2 py-0.5 text-xs shrink-0'
                      )}
                    >
                      <span
                        className={cn(
                          'h-1.5 w-1.5 rounded-full bg-current',
                          badgeVariant === 'open' && 'animate-pulse'
                        )}
                        aria-hidden="true"
                      />
                      {statusText}
                    </span>
                  </span>

                  {/* Holiday / Early-Close Pill */}
                  {ev?.holiday && holidayLabel && (
                    <span
                      className={cn(
                        'flex items-start gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-medium leading-snug w-full',
                        ev.holiday.isEarlyClose
                          ? 'bg-amber-500/10 border-amber-500/25 text-amber-200'
                          : 'bg-violet-500/10 border-violet-500/25 text-violet-200'
                      )}
                    >
                      <Calendar
                        className={cn(
                          'w-3.5 h-3.5 shrink-0 mt-0.5',
                          ev.holiday.isEarlyClose ? 'text-amber-400' : 'text-violet-400'
                        )}
                        aria-hidden="true"
                      />
                      <span>{holidayLabel}</span>
                    </span>
                  )}

                  {/* Row 2: Chile-first primary schedule + countdown + subtle local clock */}
                  <span className="flex flex-col gap-1.5 pt-2.5 border-t border-border w-full mt-auto">
                    <span className="text-[11px] uppercase font-medium text-muted-foreground tracking-wider leading-none">
                      Horario Chile
                    </span>
                    <span
                      className={cn(
                        'font-mono font-bold tabular-nums tracking-tight leading-snug',
                        isSplitSchedule ? 'text-xs xl:text-sm' : 'text-base xl:text-[17px]',
                        schedule.isHoliday ? 'text-violet-200' : 'text-zinc-100'
                      )}
                    >
                      {schedule.summary}
                    </span>
                    {transitionLine && (
                      <span className="font-mono text-xs font-medium text-zinc-300 tabular-nums leading-snug">
                        {transitionLine}
                      </span>
                    )}
                    <span className="font-mono text-[11px] text-muted-foreground tabular-nums leading-tight pt-0.5">
                      Local {ev?.localTimeFormatted ?? '--:--'}
                      {ev?.localDateFormatted ? ` · ${ev.localDateFormatted}` : ''}
                    </span>
                  </span>

                  {/* Row 3: Subtle agenda / catalyst footer indicator */}
                  <span className="flex items-center justify-between gap-2 pt-2 border-t border-border/60 w-full">
                    {hasCatalyst ? (
                      <>
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-rose-300 leading-none">
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0"
                            aria-hidden="true"
                          />
                          <span>Evento hoy</span>
                        </span>
                        <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-muted-foreground group-hover:text-zinc-200 transition-colors leading-none">
                          <span>Agenda</span>
                          <ChevronRight
                            className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform"
                            aria-hidden="true"
                          />
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-[11px] font-medium text-muted-foreground group-hover:text-zinc-200 transition-colors leading-none">
                          Agenda
                        </span>
                        <ChevronRight
                          className="w-3.5 h-3.5 text-muted-foreground group-hover:text-zinc-200 group-hover:translate-x-0.5 transition-all"
                          aria-hidden="true"
                        />
                      </>
                    )}
                  </span>
                </button>
              </motion.div>
            );
          }
        )}
      </motion.div>
    </>
  );
});

MarketCards.displayName = 'MarketCards';
