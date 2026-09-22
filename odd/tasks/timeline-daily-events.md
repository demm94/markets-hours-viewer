# Feature: Timeline Daily Events Overlay

**Workflow:** ODD (Organic Driven Development)
**Status:** In progress
**Created:** 2026-09-22

## Goal

Render daily macroeconomic and market catalysts directly on each market's timeline row in `TimelineBars.tsx` at their exact time (Chile 24h timeline reference coordinates 0-1440 min), visually indicating the degree of impact (high vs medium) and providing an interactive tooltip with event details.

## Frozen decisions (user-owned)

| Decision | Choice |
| --- | --- |
| Location | On each market's respective row (and on Chile row for Chile events) |
| Impact representation | Visual hierarchy: High (crimson/rose glowing badge/pin with flame icon) vs Medium (amber glowing badge/pin with activity icon) |
| Interaction | Popover/tooltip on hover/tap showing event title, Chile time, market local time, forecast vs previous, with option to open full drawer |

## Non-goals

- No alterations to 60 FPS timeline scrubbing performance.
- No heavy runtime dependencies (e.g. external chart libraries or heavy popover packages).
- No modification of existing market trading session calculation rules.

## Hard constraints

- **60 FPS timeline scrubbing**: Event markers must render cleanly without causing reflow or jank during scrubber drags.
- **Baseline stays green**: `npm run test` and `npm run build` must pass at every step.
- **TDD / Domain separation**: Core event projection logic in `src/core/events.ts` accompanied by unit tests in `src/core/events.test.ts`.

## Tasks

### Phase 1 — Core domain projection & tests — DONE
- [x] 1.1 Implement `getEventsForChileDay(referenceDate, events)` in `src/core/events.ts`.
- [x] 1.2 Add unit tests in `src/core/events.test.ts` validating correct minute mapping, market categorization, and Chile timezone conversion.

### Phase 2 — Marker component & timeline integration — DONE
- [x] 2.1 Separate session track overflow clipping from marker layer in `src/components/timeline/TimelineBars.tsx` so markers and tooltips are not sliced.
- [x] 2.2 Create `TimelineEventMarker` presentational component with neon styling, high/medium impact badges, and accessible popover tooltip.
- [x] 2.3 Connect daily events to `TimelineGrid` / `TimelineBars` from `App.tsx`.
- [x] 2.4 Added impact pins to `TimelineLegend.tsx`.

### Phase 3 — Verification & build — DONE
- [x] 3.1 Verify with Vitest test suite (`npm test`): 4 test files, 27/27 tests passed.
- [x] 3.2 Verify production build (`npm run build`): clean build with zero warnings.
