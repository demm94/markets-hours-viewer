# Feature: Timeline Week Rolling Filter

**Workflow:** ODD (Organic Driven Development)
**Status:** Complete
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
- [x] Task 2: Build `TimelineWeekSelector.tsx` component with accessible chip buttons, neon accents, and event dots.
- [x] Task 3: Integrate state and projection in `App.tsx`, `TimelineHeader.tsx`, `TimelineGrid.tsx`, and `TimelineBars.tsx`.
- [x] Task 4: Functional verification, full test suite (`npm test`), and production build (`npm run build`).

## Evidence & Verification

- Task 1: Implemented `RollingDayInfo` interface in `src/core/types.ts` and `getRollingDaysWindow` in `src/core/events.ts`. Added 3 unit tests in `src/core/events.test.ts`. All 38 tests pass, build passes clean. (Route: subagent delegation attempted, fell back inline due to runtime environment write-gate). Commit: `7742d0f`.
- Task 2: Built `TimelineWeekSelector.tsx` with horizontal wheel translation, auto scroll-into-view, semantic tablist/tabs, high-contrast neon accents, and event indicator dots (crimson pulsing for high impact, amber for medium). Integrated into `TimelineHeader.tsx`. Clean build and tests passing. Commit: `0e241c4`.
- Task 3: Integrated `selectedDayIso` in `App.tsx`, wired reactive recalculation of `marketSegments`, `dailyEvents`, and `evaluationsScrubber` with selected date. Added `isToday` handling in `TimelineBars.tsx` (suppresses real-time red line on future days and exposes interactive projection needle). Clean build and 38/38 tests passing. Commit: `fd22a43`.
- Task 4: Verified full Vitest suite (`5 passed (5)`, `38 passed (38)`), verified production build (`tsc -b && vite build` bundled clean with zero errors or warnings).
