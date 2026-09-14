# Tasks: Framer Motion Animations & Ergonomic Micro-Interactions

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 80-120 lines |
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
| 1 | Install Framer Motion, animate cards, buttons, and header | PR 1 | `npm test` | Visual browser inspection | `package.json`, `src/components/*` |

## Phase 1: Dependencies & Setup

- [x] 1.1 Install `framer-motion` package into `package.json`

## Phase 2: Component Animations & Micro-Interactions

- [x] 2.1 Add staggered spring entrance and hover/tap micro-interactions to `src/components/MarketCards.tsx`
- [x] 2.2 Add tactile `whileTap` spring buttons to column toggle and "AHORA" button in `src/components/TimelineGrid.tsx`
- [x] 2.3 Add subtle breathing pulse to live status dot in `src/components/Header.tsx`

## Phase 3: Accessibility & Verification

- [x] 3.1 Verify `prefers-reduced-motion` behavior across animated components
- [x] 3.2 Update `src/core/render-optimization.test.ts` to verify motion component rendering
- [x] 3.3 Execute test suite via `npm test` to ensure all tests pass
- [x] 3.4 Build production bundle via `npm run build` to verify bundle size and TypeScript validity
