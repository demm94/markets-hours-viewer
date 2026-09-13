# Tasks: Market Hours Comparator Implementation

## Review Workload Forecast

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Medium

*Greenfield application bootstrap with tests and PWA configuration. Size exception accepted for initial scaffold.*

## Phase 1: Foundation & Project Scaffolding

- [x] 1.1 Scaffold project structure with `package.json`, `tsconfig.json`, and `vite.config.ts` supporting `vite-plugin-pwa`.
- [x] 1.2 Install runtime and dev dependencies: `luxon`, `@types/luxon`, `lucide-react`, and `vitest`.
- [x] 1.3 Create core domain contracts in `src/core/types.ts` for markets, sessions, segments, and evaluation states.
- [x] 1.4 Define exchange metadata and trading schedules in `src/core/markets.ts` (TWSE, KRX, SSE, NSE, NYSE, Chile anchor).

## Phase 2: Timezone Engine & Unit Tests

- [x] 2.1 Implement pure IANA projection and interval calculation in `src/core/timezone.ts`.
- [x] 2.2 Write comprehensive unit tests in `src/core/timezone.test.ts` covering DST shifts, midnight wraps, and lunch breaks.
- [x] 2.3 Run Vitest test suite (`npx vitest run`) to verify all timezone scenarios pass.

## Phase 3: Timeline & Interaction Components

- [x] 3.1 Implement `src/hooks/useCurrentTime.ts` for live Santiago clock and automatic minute ticker.
- [x] 3.2 Implement `src/hooks/useScrubber.ts` for low-latency pointer tracking and mobile touch dragging across 0-1440 minutes.
- [x] 3.3 Create `src/components/Header.tsx` displaying Santiago live time, UTC-3/4 offset indicator, and open market counts.
- [x] 3.4 Create `src/components/MarketCards.tsx` rendering quick-status summary pills for each exchange.
- [x] 3.5 Create `src/components/TrackRow.tsx` rendering 24-hour visual session blocks (regular, lunch, pre-market) and local time badges.
- [x] 3.6 Create `src/components/TimelineGrid.tsx` assembling the reference time axis, stacked rows, scrubber line, and "Now" line.

## Phase 4: Integration, PWA Shell & Verification

- [x] 4.1 Assemble the dashboard in `src/App.tsx` coordinating time hooks and visualizer components.
- [x] 4.2 Polish dark-mode financial theme, contrast, and responsive layout in `src/index.css`.
- [x] 4.3 Configure PWA web app manifest and offline caching service worker in `vite.config.ts` and `index.html`.
- [x] 4.4 Run production build (`npm run build`) and verify bundle integrity and offline capability.
