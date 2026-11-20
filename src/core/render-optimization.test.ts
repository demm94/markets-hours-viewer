import { describe, it, expect } from 'vitest';
import { DateTime } from 'luxon';
import { Header } from '../components/Header';
import { AlertsPopover } from '../components/AlertsPopover';
import { LiveStatusBar } from '../components/LiveStatusBar';
import { MsciEmStrip } from '../components/MsciEmStrip';
import { TodayAgendaStrip } from '../components/TodayAgendaStrip';
import { MarketCards } from '../components/MarketCards';
import { TimelineGrid } from '../components/TimelineGrid';
import { TimelineHeader } from '../components/timeline/TimelineHeader';
import { TimelineLeftColumn } from '../components/timeline/TimelineLeftColumn';
import { TimelineBars } from '../components/timeline/TimelineBars';
import { TimelineLegend } from '../components/timeline/TimelineLegend';
import { TimelineWeekSelector } from '../components/timeline/TimelineWeekSelector';
import { evaluateMarketAt } from './timezone';
import { MARKETS } from './markets';

describe('React memoization & render optimization verification', () => {
  const REACT_MEMO_TYPE = Symbol.for('react.memo');

  it('verifies top-level components are wrapped with React.memo', () => {
    expect((Header as any).$$typeof).toBe(REACT_MEMO_TYPE);
    expect(Header.displayName).toBe('Header');

    expect((MarketCards as any).$$typeof).toBe(REACT_MEMO_TYPE);
    expect(MarketCards.displayName).toBe('MarketCards');

    expect((TimelineGrid as any).$$typeof).toBe(REACT_MEMO_TYPE);
    expect(TimelineGrid.displayName).toBe('TimelineGrid');

    expect((AlertsPopover as any).$$typeof).toBe(REACT_MEMO_TYPE);
    expect(AlertsPopover.displayName).toBe('AlertsPopover');

    expect((LiveStatusBar as any).$$typeof).toBe(REACT_MEMO_TYPE);
    expect(LiveStatusBar.displayName).toBe('LiveStatusBar');

    expect((MsciEmStrip as any).$$typeof).toBe(REACT_MEMO_TYPE);
    expect(MsciEmStrip.displayName).toBe('MsciEmStrip');

    expect((TodayAgendaStrip as any).$$typeof).toBe(REACT_MEMO_TYPE);
    expect(TodayAgendaStrip.displayName).toBe('TodayAgendaStrip');
  });

  it('verifies decomposed timeline atomic subcomponents are wrapped with React.memo', () => {
    expect((TimelineHeader as any).$$typeof).toBe(REACT_MEMO_TYPE);
    expect(TimelineHeader.displayName).toBe('TimelineHeader');

    expect((TimelineLeftColumn as any).$$typeof).toBe(REACT_MEMO_TYPE);
    expect(TimelineLeftColumn.displayName).toBe('TimelineLeftColumn');

    expect((TimelineBars as any).$$typeof).toBe(REACT_MEMO_TYPE);
    expect(TimelineBars.displayName).toBe('TimelineBars');

    expect((TimelineLegend as any).$$typeof).toBe(REACT_MEMO_TYPE);
    expect(TimelineLegend.displayName).toBe('TimelineLegend');

    expect((TimelineWeekSelector as any).$$typeof).toBe(REACT_MEMO_TYPE);
    expect(TimelineWeekSelector.displayName).toBe('TimelineWeekSelector');
  });

  it('verifies market evaluation stability across seconds within the same minute', () => {
    const nyse = MARKETS.find((m) => m.id === 'nyse')!;

    // Second 05 vs Second 45 of the same minute
    const t1 = DateTime.fromISO('2026-09-15T14:30:05', { zone: 'America/New_York' });
    const t2 = DateTime.fromISO('2026-09-15T14:30:45', { zone: 'America/New_York' });

    const eval1 = evaluateMarketAt(nyse, t1);
    const eval2 = evaluateMarketAt(nyse, t2);

    expect(eval1.status).toBe(eval2.status);
    expect(eval1.localTimeFormatted).toBe(eval2.localTimeFormatted);
    expect(eval1.localDateFormatted).toBe(eval2.localDateFormatted);
    expect(eval1.activeSegmentLabel).toBe(eval2.activeSegmentLabel);
  });

  it('confirms orphaned components have been removed', async () => {
    let trackRowExists = true;
    try {
      await import('../components/TrackRow' as any);
    } catch {
      trackRowExists = false;
    }
    expect(trackRowExists).toBe(false);

    let timelineSliderExists = true;
    try {
      await import('../components/timeline/TimelineSlider' as any);
    } catch {
      timelineSliderExists = false;
    }
    expect(timelineSliderExists).toBe(false);

    let radarExists = true;
    try {
      await import('../components/trading-windows/TradingWindowsRadar' as any);
    } catch {
      radarExists = false;
    }
    expect(radarExists).toBe(false);

    let pullToRefreshExists = true;
    try {
      await import('../hooks/usePullToRefresh' as any);
    } catch {
      pullToRefreshExists = false;
    }
    expect(pullToRefreshExists).toBe(false);

    let scrubberHookExists = true;
    try {
      await import('../hooks/useScrubber' as any);
    } catch {
      scrubberHookExists = false;
    }
    expect(scrubberHookExists).toBe(false);
  });
});
