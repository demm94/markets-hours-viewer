import React from 'react';
import { MarketConfig, MarketEvaluation, TimelineSegment } from '../../core/types';
import {
  getTimelineLeftColumnSublabel,
  summarizeTimelineDaySegments
} from '../../core/timeline-schedule';

interface TimelineLeftColumnProps {
  markets: MarketConfig[];
  marketSegments: Record<string, TimelineSegment[]>;
  liveEvaluations: Record<string, MarketEvaluation>;
  isToday: boolean;
  simulateWeekday: boolean;
  activeMarketIds?: ReadonlySet<string>;
  focusedMarketId?: string | null;
}

export const TimelineLeftColumn: React.FC<TimelineLeftColumnProps> = React.memo(({
  markets,
  marketSegments,
  liveEvaluations,
  isToday,
  simulateWeekday,
  activeMarketIds,
  focusedMarketId = null
}) => {
  return (
    <div className="timeline-left-column w-[104px] min-w-[104px] sm:w-[164px] sm:min-w-[164px] md:w-[192px] md:min-w-[192px] rounded-tl-xl bg-card border-r border-border flex flex-col z-20 shrink-0">
      <div className="h-7 sm:h-10 flex items-center justify-between px-1.5 sm:px-3 border-b border-border bg-muted rounded-tl-xl font-mono text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        <span>Bolsa</span>
        <span className="hidden sm:inline text-[10px] font-normal text-zinc-400">Hora CL</span>
      </div>

      {markets.map((market) => {
        const segments = marketSegments[market.id] ?? [];
        const summary = summarizeTimelineDaySegments(segments);
        const liveEv = liveEvaluations[market.id];
        const isHoliday = summary.kind === 'holiday';
        const isClosedDay = summary.kind === 'closed';
        const showLiveStatus = isToday && !simulateWeekday;
        const sublabel = getTimelineLeftColumnSublabel(summary, liveEv, showLiveStatus);

        const isFocusedRow = focusedMarketId === market.id;
        const isActiveAtHover = !isFocusedRow && Boolean(activeMarketIds?.has(market.id));
        const isDimmedRow = Boolean(focusedMarketId && focusedMarketId !== market.id);

        let dotClass = 'bg-zinc-600';
        if (isHoliday) {
          dotClass = 'bg-violet-400';
        } else if (showLiveStatus) {
          if (liveEv?.status === 'open') {
            dotClass = 'bg-emerald-400 animate-pulse';
          } else if (liveEv?.status === 'lunch') {
            dotClass = 'bg-amber-400';
          } else if (liveEv?.status === 'pre_market') {
            dotClass = 'bg-sky-400';
          }
        } else if (!isClosedDay) {
          dotClass = 'bg-emerald-400/70';
        }

        let summaryColorClass = 'text-zinc-300';
        if (isHoliday) {
          summaryColorClass = 'text-violet-300';
        } else if (isClosedDay) {
          summaryColorClass = 'text-zinc-500';
        } else if (summary.isEarlyClose) {
          summaryColorClass = 'text-amber-300';
        } else if (showLiveStatus && liveEv?.status === 'open') {
          summaryColorClass = 'text-emerald-300';
        } else if (showLiveStatus && liveEv?.status === 'lunch') {
          summaryColorClass = 'text-amber-300';
        } else if (showLiveStatus && liveEv?.status === 'pre_market') {
          summaryColorClass = 'text-sky-300';
        }

        const ariaLabel = isHoliday
          ? `${market.name}: Feriado${summary.holidayName ? ` (${summary.holidayName})` : ''}`
          : isClosedDay
          ? `${market.name}: Cerrado`
          : sublabel !== summary.label
          ? `${market.name}: ${sublabel} (${summary.label} hora Chile)`
          : summary.isEarlyClose
          ? `${market.name}: ${summary.label} hora Chile (cierre temprano${
              summary.holidayName ? `: ${summary.holidayName}` : ''
            })`
          : `${market.name}: ${summary.label} hora Chile`;

        const rowHighlightClass = isFocusedRow
          ? 'bg-white/[0.06] shadow-[inset_2px_0_0_0_#38bdf8]'
          : isActiveAtHover
          ? 'bg-emerald-500/[0.07] shadow-[inset_2px_0_0_0_rgba(16,185,129,0.75)]'
          : 'hover:bg-white/[0.02]';

        return (
          <div
            key={market.id}
            className={`h-[36px] sm:h-[46px] md:h-[50px] flex flex-col justify-center px-1.5 sm:px-3 border-b border-border last:border-b-0 transition-[background-color,box-shadow,opacity] duration-150 ${rowHighlightClass} ${
              isDimmedRow ? 'opacity-70' : isHoliday ? 'opacity-80' : ''
            }`}
            title={ariaLabel}
            aria-label={ariaLabel}
          >
            <div className="flex items-center justify-between gap-1 min-w-0">
              <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                <span aria-hidden="true" className="text-xs sm:text-base leading-none select-none shrink-0">
                  {market.flag}
                </span>
                <span className="text-[10.5px] sm:text-xs font-semibold text-zinc-100 truncate">
                  {market.id === 'krx' ? (
                    <>
                      <span className="sm:hidden">Corea</span>
                      <span className="hidden sm:inline">{market.name}</span>
                    </>
                  ) : (
                    market.name
                  )}
                </span>
              </div>
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClass}`} aria-hidden="true" />
            </div>

            <div className="flex items-center gap-1 min-w-0 mt-0.5">
              <span
                className={`font-mono text-[9px] sm:text-[11px] font-semibold tabular-nums tracking-tight sm:tracking-normal leading-none truncate ${summaryColorClass}`}
              >
                {sublabel}
              </span>
              {summary.isEarlyClose && (
                <span className="hidden sm:inline text-[10px] font-normal text-amber-300/80 whitespace-nowrap shrink-0">
                  · temprano
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
});

TimelineLeftColumn.displayName = 'TimelineLeftColumn';
