import { describe, it, expect } from 'vitest';
import { DateTime } from 'luxon';
import { Header } from '../components/Header';
import { AlertsPopover } from '../components/AlertsPopover';
import { LiveStatusBar } from '../components/LiveStatusBar';
import { TodayAgendaStrip } from '../components/TodayAgendaStrip';
import { MarketCards } from '../components/MarketCards';
import { TimelineGrid } from '../components/TimelineGrid';
import { TimelineHeader } from '../components/timeline/TimelineHeader';
import { TimelineLeftColumn } from '../components/timeline/TimelineLeftColumn';
import { TimelineBars } from '../components/timeline/TimelineBars';
import { TimelineLegend } from '../components/timeline/TimelineLegend';
import {
  calculateScrubberMinutesFromBounds,
  resolveScrubberKeyAction,
  shouldClearScrubberOnLeave,
  resolveScrubberCancelState
} from '../hooks/useScrubber';
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
  });

  describe('useScrubber behavioral interaction logic', () => {
    it('maps pointer clientX coordinates accurately into clamped [0, 1440] minutes', () => {
      // Container from x=100 to x=900 (width 800)
      expect(calculateScrubberMinutesFromBounds(100, 100, 800)).toBe(0);
      expect(calculateScrubberMinutesFromBounds(500, 100, 800)).toBe(720);
      expect(calculateScrubberMinutesFromBounds(900, 100, 800)).toBe(1440);

      // Out-of-bounds pointer clamping
      expect(calculateScrubberMinutesFromBounds(20, 100, 800)).toBe(0);
      expect(calculateScrubberMinutesFromBounds(1200, 100, 800)).toBe(1440);

      // Degenerate zero-width container
      expect(calculateScrubberMinutesFromBounds(300, 100, 0)).toBeNull();
    });

    it('resolves keyboard scrubber navigation steps and clamping', () => {
      expect(resolveScrubberKeyAction('ArrowRight', null, 720)).toEqual({
        handled: true,
        nextMinutes: 735,
        isHovering: true
      });
      expect(resolveScrubberKeyAction('ArrowLeft', 10, 720)).toEqual({
        handled: true,
        nextMinutes: 0,
        isHovering: true
      });
      expect(resolveScrubberKeyAction('ArrowUp', 720, 720)).toEqual({
        handled: true,
        nextMinutes: 735,
        isHovering: true
      });
      expect(resolveScrubberKeyAction('ArrowDown', 720, 720)).toEqual({
        handled: true,
        nextMinutes: 705,
        isHovering: true
      });
      expect(resolveScrubberKeyAction('ArrowDown', 5, 720)).toEqual({
        handled: true,
        nextMinutes: 0,
        isHovering: true
      });
      expect(resolveScrubberKeyAction('ArrowUp', 1435, 720)).toEqual({
        handled: true,
        nextMinutes: 1440,
        isHovering: true
      });
      expect(resolveScrubberKeyAction('PageUp', 1400, 720)).toEqual({
        handled: true,
        nextMinutes: 1440,
        isHovering: true
      });
      expect(resolveScrubberKeyAction('PageDown', 120, 720)).toEqual({
        handled: true,
        nextMinutes: 60,
        isHovering: true
      });
      expect(resolveScrubberKeyAction('Home', 720, 720)).toEqual({
        handled: true,
        nextMinutes: 0,
        isHovering: true
      });
      expect(resolveScrubberKeyAction('End', 720, 720)).toEqual({
        handled: true,
        nextMinutes: 1440,
        isHovering: true
      });
      expect(resolveScrubberKeyAction('Escape', 800, 720)).toEqual({
        handled: true,
        nextMinutes: null,
        isHovering: false,
        isDragging: false
      });
      expect(resolveScrubberKeyAction('Tab', 800, 720).handled).toBe(false);
    });

    it('preserves pinned or touch scrubber positions on pointer leave and clears unpinned mouse hover', () => {
      // Unpinned mouse leave clears preview
      expect(shouldClearScrubberOnLeave('mouse', false, false)).toBe(true);
      // Pinned mouse leave preserves position so desktop users can click "Volver a Ahora"
      expect(shouldClearScrubberOnLeave('mouse', false, true)).toBe(false);
      // Active drag preserves position
      expect(shouldClearScrubberOnLeave('mouse', true, false)).toBe(false);
      // Touch/pen pointer leave preserves scrubbed position
      expect(shouldClearScrubberOnLeave('touch', false, false)).toBe(false);
      expect(shouldClearScrubberOnLeave('pen', false, false)).toBe(false);
    });

    it('restores prior pin state on pointercancel so vertical scrolling does not accidentally pin', () => {
      expect(resolveScrubberCancelState(false, null)).toEqual({
        isPinned: false,
        scrubberMinutes: null,
        isHovering: false
      });
      expect(resolveScrubberCancelState(true, 600)).toEqual({
        isPinned: true,
        scrubberMinutes: 600,
        isHovering: true
      });
    });
  });
});
