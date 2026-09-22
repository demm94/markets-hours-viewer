# Feature: Timeline 24h Responsive Fit Redesign (Glanceability Optimization)

**Workflow:** ODD (Organic Driven Development)
**Status:** Completed
**Created:** 2026-09-22

## Goal

Redesign the timeline system so that the entire 24-hour day fits 100% of the screen width without mandatory horizontal scrolling on mobile, allowing users to absorb the global market status, overlaps, and catalysts at a single glance on any device.

## Frozen decisions (user-owned)

| Decision | Choice |
| --- | --- |
| Scalability | Fit 24 hours to 100% width (`w-full min-w-0`), eliminating horizontal scroll clipping on mobile |
| Glanceability | Single vertical "AHORA" red needle cutting across all markets simultaneously |
| Density & Feedback | Countdown to next market transition (e.g. "Cierra en 1h 20m" / "Abre en 4h 30m") |
| Touch Interaction | Full 60 FPS interactive scrubber across full screen width without page scroll jank |

## Tasks

### Phase 1 — Core Domain: Market Transition Countdown & Tests
- [x] 1.1 Implement `getNextTransition(market, instant)` in `src/core/timezone.ts` to calculate time until open, close, or lunch.
- [x] 1.2 Update `evaluateMarketAt` to include `nextTransition` in `MarketEvaluation`.
- [x] 1.3 Add unit tests in `src/core/timezone.test.ts` for countdown formatting and state transitions.

### Phase 2 — Responsive Layout & Fit 24h Implementation
- [x] 2.1 Remove `min-w-[800px]` from `src/components/timeline/TimelineBars.tsx` and make timeline bar container `w-full min-w-0`.
- [x] 2.2 Remove `overflow-x-auto` from `timeline-table-wrapper` in `src/components/TimelineGrid.tsx`.
- [x] 2.3 Optimize `TimelineLeftColumn.tsx` for responsive compact display on mobile (`w-16 sm:w-20 md:w-[220px]`).
- [x] 2.4 Update `TimelineHeader.tsx` and `TimelineSlider.tsx` controls for the fit layout.

### Phase 3 — Verification & Delivery
- [x] 3.1 Run Vitest suite (`npm test`).
- [x] 3.2 Run production build (`npm run build`).
