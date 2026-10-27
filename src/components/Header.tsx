import React from 'react';
import { DateTime } from 'luxon';
import { Activity, Bell, BellOff, BellRing, Calendar } from 'lucide-react';
import { Badge } from './ui/badge';
import { getSantiagoOffsetDescription } from '../core/timezone';
import { NotificationPermissionState } from '../hooks/useMarketNotifications';

interface HeaderProps {
  now: DateTime;
  timeFormatted: string;
  dateFormatted: string;
  openMarketsCount: number;
  totalMarketsCount: number;
  onOpenEvents?: () => void;
  hasUpcomingCatalysts?: boolean;
  notificationsEnabled?: boolean;
  notificationPermission?: NotificationPermissionState;
  onToggleNotifications?: () => void;
}

export const Header: React.FC<HeaderProps> = React.memo(({
  now,
  timeFormatted,
  dateFormatted,
  openMarketsCount,
  totalMarketsCount,
  onOpenEvents,
  hasUpcomingCatalysts,
  notificationsEnabled = false,
  notificationPermission = 'default',
  onToggleNotifications
}) => {
  const santiagoOffset = getSantiagoOffsetDescription(now);
  const compactOffset = santiagoOffset.split(' ')[0];
  const isDenied = notificationPermission === 'denied';
  const isUnsupported = notificationPermission === 'unsupported';
  const isActive = notificationsEnabled && notificationPermission === 'granted';

  const bellTitle = isUnsupported
    ? 'Tu navegador no soporta notificaciones web'
    : isDenied
    ? 'Permiso de notificaciones bloqueado en el navegador'
    : isActive
    ? 'Alertas de campana activas (15m antes de apertura/cierre). Clic para silenciar'
    : 'Activar alertas de campana (15m antes de apertura/cierre)';

  return (
    <header className="flex flex-col md:flex-row md:justify-between items-stretch md:items-center gap-2 sm:gap-3 md:gap-5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border border-border bg-card backdrop-blur-md shadow-neon relative overflow-hidden">
      <div className="flex items-center justify-between w-full md:w-auto gap-1.5 sm:gap-3.5 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <img src="/favicon.svg" alt="Markets View Logo" className="w-5 h-5 sm:w-5 sm:h-5 rounded shrink-0" width="20" height="20" />
          <h1 className="text-sm sm:text-base font-bold tracking-tight text-zinc-100 whitespace-nowrap truncate">
            Markets View
          </h1>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <Badge variant="open" showDot={false} className="min-h-[32px] sm:min-h-[34px] gap-1.5 px-2 sm:px-2.5 py-1 text-xs font-medium whitespace-nowrap">
            <Activity size={12} className="text-emerald-400 shrink-0" />
            <span>
              <strong className="text-emerald-300 font-semibold tabular-nums">{openMarketsCount}</strong>/{totalMarketsCount}
              <span className="hidden min-[360px]:inline"> abiertos</span>
            </span>
          </Badge>

          {onToggleNotifications && !isUnsupported && (
            <button
              type="button"
              onClick={onToggleNotifications}
              disabled={isDenied}
              aria-pressed={isActive}
              aria-label={bellTitle}
              title={bellTitle}
              className={`relative flex items-center gap-1.5 min-h-[32px] sm:min-h-[34px] px-2.5 sm:px-3 py-1 rounded-md border text-xs font-medium transition-colors duration-150 whitespace-nowrap ${
                isDenied
                  ? 'border-border bg-white/[0.01] text-zinc-500 cursor-not-allowed opacity-60'
                  : isActive
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/15 cursor-pointer'
                  : 'border-border bg-white/[0.03] hover:border-border-strong hover:bg-white/[0.06] hover:text-white active:bg-white/[0.08] text-zinc-200 cursor-pointer'
              }`}
            >
              {isDenied ? (
                <BellOff className="w-3.5 h-3.5 text-zinc-500 shrink-0" aria-hidden="true" />
              ) : isActive ? (
                <BellRing className="w-3.5 h-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
              ) : (
                <Bell className="w-3.5 h-3.5 text-zinc-400 shrink-0" aria-hidden="true" />
              )}
              <span className="hidden sm:inline">{isActive ? 'Alertas ON' : 'Alertas'}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
              )}
            </button>
          )}

          {onOpenEvents && (
            <button
              type="button"
              onClick={onOpenEvents}
              aria-label="Ver próximos eventos y catalizadores"
              className="relative flex items-center gap-1.5 min-h-[32px] sm:min-h-[34px] px-2.5 sm:px-3 py-1 rounded-md border border-border bg-white/[0.03] hover:border-border-strong hover:bg-white/[0.06] hover:text-white active:bg-white/[0.08] text-xs font-medium text-zinc-200 transition-colors duration-150 cursor-pointer whitespace-nowrap"
              title="Ver próximos eventos y catalizadores"
            >
              <Calendar className="w-3.5 h-3.5 text-zinc-400 shrink-0" aria-hidden="true" />
              <span className="hidden min-[360px]:inline">Eventos</span>
              {hasUpcomingCatalysts && (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" aria-hidden="true" />
              )}
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between w-full md:w-auto gap-1.5 sm:gap-3 md:gap-3.5 bg-muted border border-border rounded-lg px-2.5 py-1 sm:px-3 sm:py-1.5">
        <div className="flex items-center gap-1.5 font-mono text-xs font-medium text-zinc-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-zinc-200 font-semibold">Santiago</span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="font-mono text-sm sm:text-base font-bold text-zinc-100 tracking-tight tabular-nums">
            {timeFormatted}
          </span>
          <span
            className="font-mono text-xs font-medium text-zinc-300 bg-white/[0.04] border border-border px-2 py-0.5 rounded whitespace-nowrap leading-none"
            title={santiagoOffset}
          >
            <span className="hidden min-[400px]:inline">{santiagoOffset}</span>
            <span className="min-[400px]:hidden">{compactOffset}</span>
          </span>
        </div>

        <span className="text-xs font-medium text-muted-foreground capitalize whitespace-nowrap">
          {dateFormatted}
        </span>
      </div>
    </header>
  );
});

Header.displayName = 'Header';
