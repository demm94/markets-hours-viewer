# Feature: Timeline Week Rolling Filter

**Workflow:** ODD (Organic Driven Development)
**Status:** In progress
**Created:** 2026-09-29

## Goal

Provide an interactive 7-day rolling window day selector in the timeline header (from today to today + 6 days in Chile timezone), enabling users to inspect future trading sessions and macroeconomic event catalysts projected onto the 24-hour timeline.

## Frozen decisions (user-owned)

| Decision | Choice | Rationale |
| --- | --- | --- |
| Window range | Rolling 7-day window (Today + 6 days) | Financial forward-looking utility; past days of current calendar week are less actionable. |
| Timezone reference | America/Santiago (Chile) | Consistent with the app's primary timeline reference. |
| UI Placement | In `TimelineHeader.tsx` above the 24h grid | Highly visible, direct control over the timeline context. |
| Event indicator | Visual indicator dot on day chips | Informs at a glance which upcoming days carry macro catalysts. |
| Scrubber & Real-time behavior | Simulated day mode for future dates | When a future date is active, the real-time "NOW" vertical red marker is hidden and the scrubber controls date-specific simulation. |

## Tasks

- [x] Task 1: Domain helper & unit tests (`getRollingDaysWindow` in `src/core/events.ts` and tests in `src/core/events.test.ts`).
- [ ] Task 2: Build `TimelineWeekSelector.tsx` component with accessible chip buttons, neon accents, and event dots.
- [ ] Task 3: Integrate state and projection in `App.tsx`, `TimelineHeader.tsx`, `TimelineGrid.tsx`, and `TimelineBars.tsx`.
- [ ] Task 4: Functional verification, full test suite (`npm test`), and production build (`npm run build`).

## Evidence & Verification

- Task 1: Implemented `RollingDayInfo` interface in `src/core/types.ts` and `getRollingDaysWindow` in `src/core/events.ts`. Added 3 unit tests in `src/core/events.test.ts`. All 38 tests pass, build passes clean. (Route: subagent delegation attempted, fell back inline due to runtime environment write-gate).
