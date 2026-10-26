import { MarketConfig, MarketEvaluation } from './types';

export interface MarketAlertPreferences {
  enabled: boolean;
  leadMinutes: number;
  subscribedMarketIds: string[];
}

export type MarketAlertKind = 'lead_open' | 'market_open' | 'lead_close';

export interface MarketNotificationPayload {
  key: string;
  marketId: string;
  kind: MarketAlertKind;
  title: string;
  body: string;
  tag: string;
}

export const DEFAULT_LEAD_MINUTES = 15;

export function createDefaultAlertPreferences(markets: MarketConfig[]): MarketAlertPreferences {
  return {
    enabled: false,
    leadMinutes: DEFAULT_LEAD_MINUTES,
    subscribedMarketIds: markets.map((m) => m.id)
  };
}

/**
 * Pure domain evaluator that determines which market notifications should be dispatched
 * at the current minute tick, avoiding duplicate alerts via `dispatchedKeys`.
 */
export function evaluateMarketNotifications(
  markets: MarketConfig[],
  evaluations: Record<string, MarketEvaluation>,
  previousEvaluations: Record<string, MarketEvaluation> | null,
  preferences: MarketAlertPreferences,
  dispatchedKeys: ReadonlySet<string>
): MarketNotificationPayload[] {
  if (!preferences.enabled) return [];

  const subscribedSet = new Set(preferences.subscribedMarketIds);
  const leadMinutes = Math.max(1, preferences.leadMinutes || DEFAULT_LEAD_MINUTES);
  const notifications: MarketNotificationPayload[] = [];

  for (const market of markets) {
    if (!subscribedSet.has(market.id)) continue;

    const ev = evaluations[market.id];
    if (!ev) continue;

    const dateScope = ev.localDateFormatted || 'today';
    const next = ev.nextTransition;

    // 1. Pre-open countdown alert (e.g. 15 minutes before opening bell)
    if (
      ev.status !== 'open' &&
      next?.type === 'open' &&
      next.inMinutes > 0 &&
      next.inMinutes <= leadMinutes
    ) {
      const key = `${market.id}:lead_open:${dateScope}`;
      if (!dispatchedKeys.has(key)) {
        notifications.push({
          key,
          marketId: market.id,
          kind: 'lead_open',
          title: `${market.flag} ${market.name} (${market.code}) abre en ${next.inMinutes}m`,
          body: `La sesión de ${market.name} iniciará pronto (${ev.localTimeFormatted} hora local).`,
          tag: `market-alert-${market.id}-lead-open`
        });
      }
    }

    // 2. Exact opening bell transition (only when transitioning from non-open -> open)
    const prevEv = previousEvaluations?.[market.id];
    if (prevEv && prevEv.status !== 'open' && ev.status === 'open') {
      const key = `${market.id}:market_open:${dateScope}`;
      if (!dispatchedKeys.has(key)) {
        notifications.push({
          key,
          marketId: market.id,
          kind: 'market_open',
          title: `🔔 Campana de apertura: ${market.flag} ${market.name} (${market.code})`,
          body: `${market.name} acaba de iniciar su sesión regular (${ev.localTimeFormatted} hora local).`,
          tag: `market-alert-${market.id}-open`
        });
      }
    }

    // 3. Pre-close warning (e.g. 15 minutes before closing bell, including early closes)
    if (
      ev.status === 'open' &&
      next?.type === 'close' &&
      next.inMinutes > 0 &&
      next.inMinutes <= leadMinutes
    ) {
      const key = `${market.id}:lead_close:${dateScope}`;
      if (!dispatchedKeys.has(key)) {
        const earlySuffix = ev.holiday?.isEarlyClose ? ` (${ev.holiday.name})` : '';
        notifications.push({
          key,
          marketId: market.id,
          kind: 'lead_close',
          title: `${market.flag} ${market.name} (${market.code}) cierra en ${next.inMinutes}m`,
          body: `La sesión regular de ${market.name} finalizará en ${next.inMinutes} minutos${earlySuffix}.`,
          tag: `market-alert-${market.id}-lead-close`
        });
      }
    }
  }

  return notifications;
}
