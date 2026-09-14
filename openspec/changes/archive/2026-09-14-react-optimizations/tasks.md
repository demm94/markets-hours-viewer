# Tasks: React Rendering & Scrubbing Performance Optimizations

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 120-160 lines |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: stacked-to-main
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Component memoization, static hoisting, and cleanup | PR 1 | `npm test` | Manual timeline scrub profiling | `src/components/*`, `src/App.tsx` |

## Phase 1: Cleanup & Foundation

- [x] 1.1 Remove unused orphaned component `src/components/TrackRow.tsx`

## Phase 2: Component Memoization & Geometry Hoisting

- [x] 2.1 Wrap `src/components/Header.tsx` in `React.memo` to prevent re-renders on scrubber events
- [x] 2.2 Wrap `src/components/MarketCards.tsx` in `React.memo` with shallow prop comparison
- [x] 2.3 Hoist static `HOURS` array and reference constants outside render body in `src/components/TimelineGrid.tsx`
- [x] 2.4 Wrap `src/components/TimelineGrid.tsx` in `React.memo`

## Phase 3: Root State & Callback Stabilization

- [x] 3.1 Stabilize callbacks and props in `src/App.tsx` passed to `Header`, `MarketCards`, and `TimelineGrid`

## Phase 4: Verification & Regression Tests

- [x] 4.1 Run unit test suite via `npm test` ensuring existing domain tests pass
- [x] 4.2 Add render verification test asserting `Header` and `MarketCards` do not re-render during scrub
- [x] 4.3 Build application bundle via `npm run build` to verify type safety and tree-shaking
