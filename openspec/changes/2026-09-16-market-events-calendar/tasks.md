# Tasks: Market Events Calendar Implementation

## Review Workload Forecast

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: single-pr
400-line budget risk: Medium

*Implementation adds decoupled domain types, an offline events engine, a responsive drawer component, and lightweight header/card trigger hooks.*

## Phase 1: Domain Models & Events Engine

- [x] 1.1 Extend `src/core/types.ts` with `EventImportance`, `EventCategory`, `MarketEvent`, and `FormattedMarketEvent`.
- [x] 1.2 Implement `src/core/events.ts` with the curated macro announcements dataset and query/formatting utilities (`getUpcomingEvents`, `filterEvents`, `formatEventTimes`).
- [x] 1.3 Create unit tests in `src/core/events.test.ts` validating sorting, market/importance filtering, and timezone conversion to `America/Santiago`.
- [x] 1.4 Run Vitest suite (`npm test`) to ensure pure domain logic passes.

## Phase 2: Events Drawer Presentation

- [x] 2.1 Create `src/components/EventsDrawer.tsx` with slide-over drawer layout, animated backdrop, and keyboard (`Escape`) dismissal.
- [x] 2.2 Implement market filter tabs and importance toggle buttons inside `EventsDrawer.tsx`.
- [x] 2.3 Build event card items displaying category tags, high/medium impact badges, and dual time labels (Chile vs Exchange local time).

## Phase 3: Dashboard Integration & Entry Points

- [x] 3.1 Update `src/components/Header.tsx` with an "Eventos" trigger button and dynamic indicator when high-impact events are scheduled today.
- [x] 3.2 Update `src/components/MarketCards.tsx` to show a subtle catalyst dot and pass an `onSelectMarketEvents` callback to open the drawer pre-filtered.
- [x] 3.3 Coordinate drawer visibility and market selection state in `src/App.tsx`.

## Phase 4: Verification & Build

- [x] 4.1 Run complete test suite (`npm test`) to confirm zero regressions across timezone, rendering, and event suites.
- [x] 4.2 Run production build (`npm run build`) to verify TypeScript type checking, bundle assets, and service worker generation.
