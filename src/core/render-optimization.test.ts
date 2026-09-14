import { describe, it, expect } from 'vitest';
import { Header } from '../components/Header';
import { MarketCards } from '../components/MarketCards';
import { TimelineGrid } from '../components/TimelineGrid';

describe('React memoization & render optimization verification', () => {
  const REACT_MEMO_TYPE = Symbol.for('react.memo');

  it('verifies Header component is wrapped with React.memo', () => {
    expect((Header as any).$$typeof).toBe(REACT_MEMO_TYPE);
    expect(Header.displayName).toBe('Header');
  });

  it('verifies MarketCards component is wrapped with React.memo', () => {
    expect((MarketCards as any).$$typeof).toBe(REACT_MEMO_TYPE);
    expect(MarketCards.displayName).toBe('MarketCards');
  });

  it('verifies TimelineGrid component is wrapped with React.memo', () => {
    expect((TimelineGrid as any).$$typeof).toBe(REACT_MEMO_TYPE);
    expect(TimelineGrid.displayName).toBe('TimelineGrid');
  });

  it('confirms orphaned TrackRow component has been removed', async () => {
    let trackRowExists = true;
    try {
      await import('../components/TrackRow' as any);
    } catch {
      trackRowExists = false;
    }
    expect(trackRowExists).toBe(false);
  });
});
