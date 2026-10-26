import { describe, it, expect } from 'vitest';
import { MARKETS } from './markets';
import { MarketEvaluation } from './types';
import {
  createDefaultAlertPreferences,
  evaluateMarketNotifications,
  MarketAlertPreferences
} from './notifications';

describe('market notifications engine', () => {
  const basePreferences: MarketAlertPreferences = {
    ...createDefaultAlertPreferences(MARKETS),
    enabled: true,
    leadMinutes: 15
  };

  it('returns empty list when notifications are disabled', () => {
    const evaluations: Record<string, MarketEvaluation> = {
      nyse: {
        marketId: 'nyse',
        status: 'closed',
        localTimeFormatted: '09:15',
        localDateFormatted: 'mar 15 sep',
        nextTransition: {
          type: 'open',
          inMinutes: 15,
          formattedCountdown: 'Abre en 15m'
        }
      }
    };

    const result = evaluateMarketNotifications(
      MARKETS,
      evaluations,
      null,
      { ...basePreferences, enabled: false },
      new Set()
    );

    expect(result).toHaveLength(0);
  });

  it('triggers lead_open notification when market is within leadMinutes of opening and deduplicates', () => {
    const evaluations: Record<string, MarketEvaluation> = {
      nyse: {
        marketId: 'nyse',
        status: 'closed',
        localTimeFormatted: '09:15',
        localDateFormatted: 'mar 15 sep',
        nextTransition: {
          type: 'open',
          inMinutes: 15,
          formattedCountdown: 'Abre en 15m'
        }
      }
    };

    const dispatched = new Set<string>();
    const firstPass = evaluateMarketNotifications(
      MARKETS,
      evaluations,
      null,
      basePreferences,
      dispatched
    );

    expect(firstPass).toHaveLength(1);
    expect(firstPass[0].kind).toBe('lead_open');
    expect(firstPass[0].marketId).toBe('nyse');
    expect(firstPass[0].title).toContain('abre en 15m');

    // Add key to dispatched set -> subsequent tick within window must not duplicate
    dispatched.add(firstPass[0].key);
    const secondPass = evaluateMarketNotifications(
      MARKETS,
      evaluations,
      null,
      basePreferences,
      dispatched
    );
    expect(secondPass).toHaveLength(0);
  });

  it('triggers market_open bell only on transition from non-open to open (no spam on initial load)', () => {
    const openEval: Record<string, MarketEvaluation> = {
      nyse: {
        marketId: 'nyse',
        status: 'open',
        localTimeFormatted: '09:30',
        localDateFormatted: 'mar 15 sep',
        nextTransition: {
          type: 'close',
          inMinutes: 390,
          formattedCountdown: 'Cierra en 6h 30m'
        }
      }
    };

    // Initial load (previousEvaluations is null): should NOT fire opening bell for already-open market
    const initialLoad = evaluateMarketNotifications(
      MARKETS,
      openEval,
      null,
      basePreferences,
      new Set()
    );
    expect(initialLoad).toHaveLength(0);

    // Transition from closed -> open: MUST fire opening bell
    const prevClosed: Record<string, MarketEvaluation> = {
      nyse: {
        marketId: 'nyse',
        status: 'closed',
        localTimeFormatted: '09:29',
        localDateFormatted: 'mar 15 sep'
      }
    };

    const onBell = evaluateMarketNotifications(
      MARKETS,
      openEval,
      prevClosed,
      basePreferences,
      new Set()
    );
    expect(onBell).toHaveLength(1);
    expect(onBell[0].kind).toBe('market_open');
    expect(onBell[0].title).toContain('Campana de apertura');
  });

  it('triggers lead_close notification and includes early-close holiday context when applicable', () => {
    const blackFridayCloseEval: Record<string, MarketEvaluation> = {
      nyse: {
        marketId: 'nyse',
        status: 'open',
        localTimeFormatted: '12:45',
        localDateFormatted: 'vie 27 nov',
        holiday: {
          marketId: 'nyse',
          date: '2026-11-27',
          name: 'Cierre temprano post-Thanksgiving (13:00)',
          isEarlyClose: true,
          closeTime: '13:00'
        },
        nextTransition: {
          type: 'close',
          inMinutes: 15,
          formattedCountdown: 'Cierra en 15m'
        }
      }
    };

    const result = evaluateMarketNotifications(
      MARKETS,
      blackFridayCloseEval,
      null,
      basePreferences,
      new Set()
    );

    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe('lead_close');
    expect(result[0].title).toContain('cierra en 15m');
    expect(result[0].body).toContain('Cierre temprano post-Thanksgiving');
  });

  it('respects per-market subscription filters', () => {
    const evaluations: Record<string, MarketEvaluation> = {
      nyse: {
        marketId: 'nyse',
        status: 'closed',
        localTimeFormatted: '09:20',
        localDateFormatted: 'mar 15 sep',
        nextTransition: {
          type: 'open',
          inMinutes: 10,
          formattedCountdown: 'Abre en 10m'
        }
      }
    };

    const prefsWithoutNyse: MarketAlertPreferences = {
      ...basePreferences,
      subscribedMarketIds: ['twse', 'krx', 'sse', 'nse']
    };

    const result = evaluateMarketNotifications(
      MARKETS,
      evaluations,
      null,
      prefsWithoutNyse,
      new Set()
    );
    expect(result).toHaveLength(0);
  });
});
