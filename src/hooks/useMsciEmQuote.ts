import { useState, useEffect, useCallback, useRef } from 'react';
import {
  MSCI_EM_CACHE_KEY,
  MSCI_EM_ENDPOINT,
  MsciEmQuote,
  parseMsciEmQuote
} from '../core/msci-em';

const POLL_INTERVAL_MS = 60_000;
const STALE_ON_VISIBLE_MS = 45_000;

export interface UseMsciEmQuoteResult {
  quote: MsciEmQuote | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  isStale: boolean;
  refresh: () => void;
}

function readCachedQuote(): MsciEmQuote | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(MSCI_EM_CACHE_KEY);
    if (!raw) return null;
    return parseMsciEmQuote(JSON.parse(raw));
  } catch {
    return null;
  }
}

function writeCachedQuote(quote: MsciEmQuote): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(MSCI_EM_CACHE_KEY, JSON.stringify(quote));
  } catch {
    // Ignore quota or storage restriction errors
  }
}

export function useMsciEmQuote(): UseMsciEmQuoteResult {
  const initialCachedRef = useRef<MsciEmQuote | null>(null);
  if (initialCachedRef.current === null && typeof window !== 'undefined') {
    initialCachedRef.current = readCachedQuote();
  }

  const [quote, setQuote] = useState<MsciEmQuote | null>(() => readCachedQuote());
  const [isLoading, setIsLoading] = useState<boolean>(() => quote === null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isStale, setIsStale] = useState<boolean>(false);

  const quoteRef = useRef<MsciEmQuote | null>(quote);
  quoteRef.current = quote;

  const isFromCacheRef = useRef<boolean>(quote !== null);
  const lastSuccessAtRef = useRef<number>(0);
  const activeControllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef<boolean>(true);

  const fetchLatest = useCallback(async () => {
    activeControllerRef.current?.abort();
    const controller = new AbortController();
    activeControllerRef.current = controller;

    if (mountedRef.current) {
      setIsRefreshing(true);
      if (!quoteRef.current) {
        setIsLoading(true);
      }
    }

    try {
      const response = await fetch(MSCI_EM_ENDPOINT, {
        cache: 'no-store',
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const json: unknown = await response.json();
      const parsed = parseMsciEmQuote(json);
      if (!parsed) {
        throw new Error('Malformed MSCI EM payload');
      }

      if (!mountedRef.current || controller.signal.aborted) return;

      lastSuccessAtRef.current = Date.now();
      isFromCacheRef.current = false;
      quoteRef.current = parsed;
      writeCachedQuote(parsed);

      setQuote(parsed);
      setError(null);
      setIsStale(false);
      setIsLoading(false);
      setIsRefreshing(false);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      if (!mountedRef.current || controller.signal.aborted) return;

      const message = err instanceof Error ? err.message : 'Network error';
      setError(message);
      setIsLoading(false);
      setIsRefreshing(false);
      if (quoteRef.current || isFromCacheRef.current) {
        setIsStale(true);
      }
    }
  }, []);

  const refresh = useCallback(() => {
    void fetchLatest();
  }, [fetchLatest]);

  useEffect(() => {
    mountedRef.current = true;
    let intervalId: number | null = null;

    const startPolling = () => {
      if (intervalId !== null) return;
      intervalId = window.setInterval(() => {
        if (document.visibilityState === 'visible') {
          void fetchLatest();
        }
      }, POLL_INTERVAL_MS);
    };

    const stopPolling = () => {
      if (intervalId !== null) {
        window.clearInterval(intervalId);
        intervalId = null;
      }
    };

    const handleVisibilityOrOnline = () => {
      if (document.visibilityState === 'hidden') {
        stopPolling();
        return;
      }

      const elapsed = Date.now() - lastSuccessAtRef.current;
      if (lastSuccessAtRef.current === 0 || elapsed >= STALE_ON_VISIBLE_MS || quoteRef.current === null) {
        void fetchLatest();
      }
      startPolling();
    };

    void fetchLatest();
    if (document.visibilityState !== 'hidden') {
      startPolling();
    }

    document.addEventListener('visibilitychange', handleVisibilityOrOnline);
    window.addEventListener('online', handleVisibilityOrOnline);

    return () => {
      mountedRef.current = false;
      stopPolling();
      activeControllerRef.current?.abort();
      document.removeEventListener('visibilitychange', handleVisibilityOrOnline);
      window.removeEventListener('online', handleVisibilityOrOnline);
    };
  }, [fetchLatest]);

  return {
    quote,
    isLoading,
    isRefreshing,
    error,
    isStale,
    refresh
  };
}
