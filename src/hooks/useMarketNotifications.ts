import { useState, useEffect, useCallback, useRef } from 'react';
import { MarketConfig, MarketEvaluation } from '../core/types';
import {
  MarketAlertPreferences,
  createDefaultAlertPreferences,
  evaluateMarketNotifications
} from '../core/notifications';

const PREFS_STORAGE_KEY = 'markets_pwa_alert_prefs_v1';
const SENT_STORAGE_KEY = 'markets_pwa_alert_sent_v1';
const MAX_STORED_KEYS = 100;

export type NotificationPermissionState = NotificationPermission | 'unsupported';

function getBrowserPermission(): NotificationPermissionState {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

function loadPreferences(markets: MarketConfig[]): MarketAlertPreferences {
  const fallback = createDefaultAlertPreferences(markets);
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(PREFS_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return {
      enabled: Boolean(parsed.enabled),
      leadMinutes:
        typeof parsed.leadMinutes === 'number' && parsed.leadMinutes > 0
          ? parsed.leadMinutes
          : fallback.leadMinutes,
      subscribedMarketIds: Array.isArray(parsed.subscribedMarketIds)
        ? parsed.subscribedMarketIds
        : fallback.subscribedMarketIds
    };
  } catch {
    return fallback;
  }
}

function loadDispatchedKeys(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(SENT_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed) : new Set();
  } catch {
    return new Set();
  }
}

function saveDispatchedKeys(keys: Set<string>): void {
  if (typeof window === 'undefined') return;
  try {
    const trimmed = Array.from(keys).slice(-MAX_STORED_KEYS);
    window.localStorage.setItem(SENT_STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // Ignore storage quota errors
  }
}

async function dispatchBrowserNotification(
  title: string,
  body: string,
  tag: string
): Promise<void> {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const options: NotificationOptions = {
    body,
    tag,
    icon: '/pwa-192x192.png',
    badge: '/favicon.svg'
  };

  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration && typeof registration.showNotification === 'function') {
        await registration.showNotification(title, options);
        return;
      }
    }
  } catch {
    // Fall through to standard Notification constructor
  }

  try {
    new Notification(title, options);
  } catch {
    // Ignore notification dispatch failures on restricted contexts
  }
}

export interface UseMarketNotificationsResult {
  permission: NotificationPermissionState;
  preferences: MarketAlertPreferences;
  toggleNotifications: () => Promise<void>;
  toggleMarketSubscription: (marketId: string) => void;
}

export function useMarketNotifications(
  markets: MarketConfig[],
  evaluations: Record<string, MarketEvaluation>
): UseMarketNotificationsResult {
  const [permission, setPermission] = useState<NotificationPermissionState>(getBrowserPermission);
  const [preferences, setPreferences] = useState<MarketAlertPreferences>(() =>
    loadPreferences(markets)
  );

  const previousEvaluationsRef = useRef<Record<string, MarketEvaluation> | null>(null);
  const dispatchedKeysRef = useRef<Set<string>>(loadDispatchedKeys());

  // Persist preferences whenever they change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(preferences));
    } catch {
      // Ignore storage quota errors
    }
  }, [preferences]);

  // Evaluate market transitions on each minute evaluation update
  useEffect(() => {
    const currentPermission = getBrowserPermission();
    setPermission(currentPermission);

    if (preferences.enabled && currentPermission === 'granted') {
      const payloads = evaluateMarketNotifications(
        markets,
        evaluations,
        previousEvaluationsRef.current,
        preferences,
        dispatchedKeysRef.current
      );

      if (payloads.length > 0) {
        for (const item of payloads) {
          dispatchedKeysRef.current.add(item.key);
          void dispatchBrowserNotification(item.title, item.body, item.tag);
        }
        saveDispatchedKeys(dispatchedKeysRef.current);
      }
    }

    previousEvaluationsRef.current = evaluations;
  }, [markets, evaluations, preferences]);

  const toggleNotifications = useCallback(async () => {
    const currentPerm = getBrowserPermission();
    setPermission(currentPerm);

    if (currentPerm === 'unsupported') return;

    if (preferences.enabled) {
      setPreferences((prev) => ({ ...prev, enabled: false }));
      return;
    }

    let finalPerm: NotificationPermission = currentPerm;
    if (currentPerm === 'default') {
      try {
        finalPerm = await Notification.requestPermission();
        setPermission(finalPerm);
      } catch {
        return;
      }
    }

    if (finalPerm === 'granted') {
      setPreferences((prev) => {
        const nextSubscribed =
          prev.subscribedMarketIds.length > 0
            ? prev.subscribedMarketIds
            : markets.map((m) => m.id);
        return {
          ...prev,
          enabled: true,
          subscribedMarketIds: nextSubscribed
        };
      });
      await dispatchBrowserNotification(
        '🔔 Alertas de mercado activadas',
        `Recibirás avisos ${preferences.leadMinutes}m antes de cada apertura y cierre bursátil.`,
        'market-alert-confirmation'
      );
    }
  }, [markets, preferences.enabled, preferences.leadMinutes]);

  const toggleMarketSubscription = useCallback((marketId: string) => {
    setPreferences((prev) => {
      const exists = prev.subscribedMarketIds.includes(marketId);
      const nextIds = exists
        ? prev.subscribedMarketIds.filter((id) => id !== marketId)
        : [...prev.subscribedMarketIds, marketId];
      return {
        ...prev,
        subscribedMarketIds: nextIds
      };
    });
  }, []);

  return {
    permission,
    preferences,
    toggleNotifications,
    toggleMarketSubscription
  };
}
