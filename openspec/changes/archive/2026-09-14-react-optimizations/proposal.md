# Proposal: React Rendering & Scrubbing Performance Optimizations

## Intent

Eliminate jank and redundant renders during high-frequency timeline scrubbing and 1-second clock ticks by introducing granular component memoization and decoupling high-frequency scrubber state from static layout subtrees.

## Scope

### In Scope
- Wrap pure visual components (`Header`, `MarketCards`, `TimelineGrid`, `TrackRow`) in `React.memo` with stable prop contracts.
- Stabilize event handler callbacks (`handlePointerDown`, `handlePointerMove`, etc.) using `useCallback`.
- Decouple scrubber drag updates from components that only care about the current second (`evaluationsNow`), preventing whole-app re-renders on pointer move.
- Profile and benchmark frame rates during scrubber drag (target steady 60 FPS).

### Out of Scope
- Rewriting timeline rendering in HTML5 Canvas / WebGL.
- Modifying Luxon timezone calculations in `core/timezone.ts`.
- Introducing external state managers (Zustand, Redux, Jotai).

## Capabilities

### New Capabilities
None

### Modified Capabilities
- `timeline-visualizer`: High-frequency pointer scrubbing render isolation and memoized track rendering.
- `pwa-shell`: Root render isolation between 1-second clock ticks and pointer drag state.

## Approach

1. Apply `React.memo` to `TrackRow`, `TimelineGrid`, `MarketCards`, and `Header` to prevent cascading renders when unrelated props change.
2. Stabilize scrubber event handlers in `useScrubber` with `useCallback`.
3. Separate high-frequency scrubber position state from root app state where possible (or isolate scrubber consumers) so dragging the scrubber cursor does not re-render market cards or the header unless scrubber evaluation values actually change.
4. Verify rendering performance using React DevTools profiler and automated render-count tests.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/App.tsx` | Modified | Isolate scrubber state and memoize props |
| `src/components/TimelineGrid.tsx` | Modified | Memoize component and track rendering |
| `src/components/TrackRow.tsx` | Modified | Add `React.memo` with custom comparison if needed |
| `src/components/MarketCards.tsx` | Modified | Add `React.memo` to isolate card re-renders |
| `src/components/Header.tsx` | Modified | Add `React.memo` to avoid re-rendering on scrub |
| `src/hooks/useScrubber.ts` | Modified | Memoize callback handlers |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Stale closures in memoized event handlers | Low | Strict dependency arrays and ESLint React hooks rule enforcement |
| Memoization overhead exceeding savings | Low | Apply `React.memo` only to components with heavy DOM subtrees or frequent prop stability |

## Rollback Plan

Revert git commit containing the component memoization and hook changes. All existing behavior is backwards-compatible.

## Dependencies

- None

## Success Criteria

- [ ] Zero re-renders of `MarketCards` and `Header` while scrubbing if evaluated values are unchanged.
- [ ] Timeline scrub pointer interaction maintains consistent 60 FPS on mobile and desktop.
- [ ] All existing unit tests pass without regression.
