# Proposal: Market Events Calendar

## Intent

Allow users to track upcoming medium and high-importance macroeconomic announcements and market catalysts for each monitored exchange (Taiwan, South Korea, China, India, and the US) synchronized to Chilean local time (`America/Santiago`), in an offline-first architecture that preserves the compact mobile layout.

## Scope

### In Scope
- **Event Domain Models**: Types for `MarketEvent`, `EventImportance` (`medium` | `high`), `EventCategory` (central bank rate decisions, CPI/inflation, GDP, jobs/PMI), and time presentation.
- **Curated Macro Dataset**: Structured offline dataset of scheduled high/medium impact events across all 5 monitored markets.
- **Timezone Synchronization**: Automatic conversion from event UTC timestamps to both exchange local time and Chilean reference time with dynamic DST compliance.
- **Market Card Badges**: Non-intrusive indicators on market cards showing upcoming high-impact event counts.
- **Events Drawer / Modal**: Clean, responsive bottom-sheet/modal displaying chronological announcements with filtering by market and importance.
- **Unit Tests**: Test coverage for event filtering, ordering, and timezone projection.

### Out of Scope
- Direct third-party paid API integration requiring client-side API keys.
- Push notifications / native device alarms.
- Individual equity earnings or microcap announcements.

## Capabilities

### New Capabilities
- `economic-calendar-engine`: Offline-first macro event data provider with time conversion to Chilean reference time, relative time calculation, and filtering by importance/market.
- `events-sheet-viewer`: Accessible mobile drawer/modal displaying chronological upcoming announcements with impact badges.

### Modified Capabilities
- `timeline-visualizer`: Enhance market card headers with event indicator triggers without disrupting the 5-column condensed mobile grid.

## Approach

1. Define event interfaces and categories in `src/core/types.ts`.
2. Implement `src/core/events.ts` containing the curated event catalog and helper functions (`getUpcomingEvents`, `getEventsForMarket`, `formatEventTimes`).
3. Add unit tests in `src/core/events.test.ts`.
4. Create `src/components/EventsDrawer.tsx` (using Radix/Framer Motion or accessible dialog pattern) to display filtered cards.
5. Wire an event indicator button/badge into `src/components/Header.tsx` and `src/components/MarketCards.tsx`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/core/types.ts` | Modified | Add `MarketEvent`, `EventImportance`, `EventCategory`. |
| `src/core/events.ts` | New | Curated calendar dataset and query utilities. |
| `src/core/events.test.ts` | New | Timezone and filter verification suite. |
| `src/components/EventsDrawer.tsx` | New | Sheet/drawer presenting event list. |
| `src/components/MarketCards.tsx` | Modified | Add subtle event badge indicators. |
| `src/components/Header.tsx` | Modified | Add quick access trigger for upcoming calendar. |
| `src/App.tsx` | Modified | Manage drawer open/close state. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Mobile layout crowding | Medium | Keep event triggers minimal (icon/badge); display detailed event metadata inside an overlay drawer. |
| Event schedule obsolescence | Low | Structure data cleanly so weekly/monthly updates can be dropped into `events.ts` without touching UI code. |

## Rollback Plan

Revert `src/core/types.ts`, `src/App.tsx`, `src/components/Header.tsx`, and `src/components/MarketCards.tsx` to HEAD; delete `src/core/events.ts`, `src/core/events.test.ts`, and `src/components/EventsDrawer.tsx`.
