import React from 'react';
import { Activity, Calendar } from 'lucide-react';
import { Badge } from './ui/badge';
import { AlertsPopover } from './AlertsPopover';
import { MarketConfig } from '../core/types';
import { MARKETS } from '../core/markets';
import { NotificationPermissionState } from '../hooks/useMarketNotifications';

const DEFAULT_SUBSCRIBED_MARKET_IDS: string[] = [];
const NOOP_MARKET_ALERT_TOGGLE = () => {};

export interface HeaderProps {
  openMarketsCount: number;
  totalMarketsCount: number;
  onOpenEvents?: () => void;
  hasUpcomingCatalysts?: boolean;
  notificationsEnabled?: boolean;
  notificationPermission?: NotificationPermissionState;
  onToggleNotifications?: () => void;
  markets?: MarketConfig[];
  subscribedMarketIds?: string[];
  onToggleMarketAlert?: (marketId: string) => void;
}

export const Header: React.FC<HeaderProps> = React.memo(({
  openMarketsCount,
  totalMarketsCount,
  onOpenEvents,
  hasUpcomingCatalysts,
  notificationsEnabled = false,
  notificationPermission = 'default',
  onToggleNotifications,
  markets = MARKETS,
  subscribedMarketIds = DEFAULT_SUBSCRIBED_MARKET_IDS,
  onToggleMarketAlert = NOOP_MARKET_ALERT_TOGGLE
}) => {
  const hasOpenMarkets = openMarketsCount > 0;

  return (
    <header className="flex items-center justify-between gap-2 sm:gap-3 px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl border border-border bg-card backdrop-blur-md shadow-neon relative">
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <img
            src="/favicon.svg"
            alt=""
            className="w-5 h-5 rounded shrink-0"
            width="20"
            height="20"
          />
          <h1 className="text-sm sm:text-base font-bold tracking-tight text-zinc-100 whitespace-nowrap truncate">
            Horarios Bursátiles
          </h1>
        </div>

        <Badge
          variant={hasOpenMarkets ? 'open' : 'closed'}
          showDot={false}
          className="min-h-[28px] sm:min-h-[30px] gap-1.5 px-2 sm:px-2.5 py-1 text-xs font-medium whitespace-nowrap"
        >
          <Activity
            size={12}
            className={`shrink-0 ${hasOpenMarkets ? 'text-emerald-400' : 'text-zinc-400'}`}
            aria-hidden="true"
          />
          <span>
            <strong
              className={`font-semibold tabular-nums ${
                hasOpenMarkets ? 'text-emerald-300' : 'text-zinc-200'
              }`}
            >
              {openMarketsCount}
            </strong>
            /{totalMarketsCount} abiertas
          </span>
        </Badge>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {onToggleNotifications && (
          <AlertsPopover
            markets={markets}
            notificationsEnabled={notificationsEnabled}
            notificationPermission={notificationPermission}
            subscribedMarketIds={subscribedMarketIds}
            onToggleNotifications={onToggleNotifications}
            onToggleMarketAlert={onToggleMarketAlert}
          />
        )}

        {onOpenEvents && (
          <button
            type="button"
            onClick={onOpenEvents}
            aria-label="Abrir agenda de eventos y feriados"
            title="Abrir agenda de eventos y feriados"
            className="relative inline-flex items-center justify-center gap-1.5 min-h-[36px] sm:min-h-[38px] min-w-[36px] px-2.5 sm:px-3 py-1.5 rounded-lg border border-border bg-white/[0.03] hover:border-border-strong hover:bg-white/[0.06] hover:text-white active:bg-white/[0.08] text-xs font-medium text-zinc-200 transition-colors duration-150 cursor-pointer whitespace-nowrap"
          >
            <Calendar className="w-3.5 h-3.5 text-zinc-400 shrink-0" aria-hidden="true" />
            <span className="hidden min-[460px]:inline">Agenda</span>
            {hasUpcomingCatalysts && (
              <span
                className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"
                aria-hidden="true"
              />
            )}
          </button>
        )}
      </div>
    </header>
  );
});

Header.displayName = 'Header';
