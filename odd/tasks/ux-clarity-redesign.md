# UX & Information Architecture Redesign (`markets-pwa`)
Branch: `feat/ux-clarity-redesign` | Delivery: `ask-on-risk` | Test runner: `npm test` (`vitest run`) & `npm run build`
Forecast: ~1,440 authored changed lines across 4 work-unit commits (`T1`–`T4`).

## Specs

- **S1 — Chile-centric core time helpers, honest weekend projection & status summary**: User problem: `"Actualmente mi app no me convence, la siento confusa, que no aporta info de fácil acceso y poco intuitiva."` Approved scope: `"Si, haz todo eso. Vamos!"`
  - Add pure helper to format each market's session schedule in Chile time (e.g. `10:30–17:00 CL`, split/overnight sessions, early-close adjustment, holiday state).
  - Format multi-day / weekend / holiday `nextTransition.formattedCountdown` in Chile time with explicit `CL` suffix (e.g. `Abre lun 11:30 CL`) and expose `atChileFormatted` (`HH:mm CL` or `lun HH:mm CL`) on `MarketTransition`.
  - Update `projectMarketToTimeline` to respect exchange local weekends by default (honest weekend calendar) while supporting `{ isSimulation: true }` to render reference weekday sessions on demand.
  - Add pure helpers `getLiveStatusSummary` (currently open markets or pause/weekend + nearest upcoming bell across all markets in Chile time) and `getTodayAgenda` (today's holidays, early closes, and macro events without opening drawers).
  - Checks: RED → GREEN deterministic Vitest unit tests in `src/core/timezone.test.ts`, `src/core/holidays.test.ts`, and `src/core/market-summary.test.ts`; full `npm test`.

- **S2 — Streamlined Header, unified Alerts Popover & immediate Live Status Bar**:
  - Header cleaned up in consistent neutral/Chilean Spanish, compact Santiago live clock, single `Alertas` button opening a unified `AlertsPopover` (master toggle, per-market switches for all 5 exchanges, clear note that alerts only fire while the app is open, and actionable message when permission is `denied` instead of a silent disabled button), plus single `Agenda` drawer trigger.
  - New `LiveStatusBar` directly below Header showing in one scannable bar: currently open markets (or inter-session pause / weekend closed) + next upcoming bell (`market`, countdown, Chile time).
  - Checks: `React.memo` + `displayName`, TypeScript compile (`npm run build`), Vitest suite.

- **S3 — Conditional Today's Agenda Strip ("Hoy en agenda")**:
  - New `TodayAgendaStrip` rendered directly on the main screen ONLY when today has at least one holiday, early close, or macro event; returns `null` when nothing is scheduled today.
  - Clicking an event opens `EventDetailModal`; secondary action opens `EventsDrawer`.
  - Checks: Pure data selection tested in S1, `React.memo` + `displayName`, TypeScript compile & Vitest.

- **S4 — Chile-first Market Cards & Drawer/Modal polish**:
  - `MarketCards` display primary Chile session schedule (`HH:mm–HH:mm CL`), clear status badge, countdown in Chile time, and subtle exchange local time (removing raw IANA strings like `Asia/Kolkata · UTC+5:30` and redundant per-card bell toggles).
  - On mobile (`<md`), replace the cramped 5-column strip with scannable full-width compact rows displaying flag, code, status, Chile hours, countdown, holiday/early-close badge, and consistent tap affordance (cards clickable to inspect market agenda on both mobile and desktop).
  - Fix `EventDetailModal` exit animation (`<AnimatePresence>` wrapping conditional content) and unify `EventsDrawer` / `EventDetailModal` copy (neutral Spanish, consistent `Impacto alto`/`Impacto medio`, `Pronóstico`/`Anterior`, `Hora local`, remove developer jargon `PWA Offline ready` / raw IANA footer, preserve `env(safe-area-inset-bottom)`).
  - Checks: `React.memo` + `displayName`, `timeline-visualizer.test.ts` invariants, `npm test`, `npm run build`.

- **S5 — 24h Timeline as default primary view, Pinned Scrubber, Honest Weekend Mode & Accurate Legend**:
  - Remove the competing 6-card `TradingWindowsRadar` grid from the main screen and make the 24h Timeline the primary default view.
  - Consolidate into a single section header and single column-collapse control; add edge-fade scroll affordances and clean indicators to `TimelineWeekSelector`.
  - Add honest weekend banner on Saturday/Sunday when no weekday sessions are active, showing next reopening in Chile time plus an explicit `"Ver jornada hábil de referencia"` toggle that enables simulation projection on demand.
  - Upgrade `useScrubber` so desktop hover previews smoothly and clicking/tapping **pins** the selected minute so users can release the pointer and click `"Volver a Ahora"` (visible whenever pinned/active on touch/keyboard). Add clear visible interaction hint for both desktop and mobile.
  - Fix `TimelineLegend` so `Pre-apertura` is sky blue (matching `TimelineBars`), `Almuerzo` is amber, `Ya cerró` and `Feriado` are represented accurately, and badge text is not duplicated.
  - Cut the 3-hop event chain: clicking a timeline event pin opens `EventDetailModal` directly; keep desktop hover tooltip non-interactive/pure-preview and fix ARIA (`role="slider"` must not wrap interactive buttons). Preserve `--timeline-header-h` / `--timeline-row-h` CSS vars and no `window.innerWidth`.
  - Checks: `useScrubber` pin/unpin unit tests, `render-optimization.test.ts`, `timeline-visualizer.test.ts`, `npm test`, `npm run build`.

- **S6 — Noise removal, copy unification & cleanup**:
  - Remove destructive `usePullToRefresh` (`window.location.reload()`) from `App.tsx`.
  - Calm `AmbientBackground.tsx` down to subtle static/minimal ambient depth without distracting competing animated beams/grid noise.
  - Replace developer jargon footer in `App.tsx` (`Motor IANA`, `evitar offsets estáticos`) with concise user-facing timezone copy.
  - Remove voseo (`Soltá`, `Deslizá`), English UI leaks (`Alertas ON`, `After-Hours`), dead props (`TimelineHeader`, `TimelineGrid`), unused `TradingWindowsRadar.tsx` / `usePullToRefresh.ts`, and CSS no-ops (`.neon-grid`, `.neon-bloom`), while preserving `pwaManifest.name` and `--background` invariants checked by tests.
  - Checks: `npm test`, `npm run build`, grep verification for removed voseo/jargon/dead classes.

## Tasks

- [x] **T1** (`S1`) — Core Chile-time schedule formatting, Chile-time next-bell transitions, honest weekend timeline projection, `getLiveStatusSummary` & `getTodayAgenda` + unit tests | Route: `inline` (foundational shared core contracts) | Risk: `item 3` (shared `projectMarketToTimeline` and `getNextTransition`) | Status: done (`54e789a`, RED → GREEN 86/86 tests + build pass; independent verifier PASS on S1 after 1 correction batch)
- [x] **T2** (`S2`, `S3`) — Streamlined `Header`, unified `AlertsPopover`, `LiveStatusBar`, and conditional `TodayAgendaStrip` | Route: `delegated` (parallel with T3; disjoint edit surface, >100 lines) | Risk: `none` | Status: done (`828f669`, `tsc --noEmit` + seam `npm test` 86/86 + `npm run build` pass)
- [x] **T3** (`S4`) — Chile-first `MarketCards` (desktop + scannable mobile rows) and `EventsDrawer` / `EventDetailModal` copy & animation polish | Route: `delegated` (parallel with T2; disjoint edit surface, >100 lines) | Risk: `none` | Status: done (`1f9f357`, `tsc --noEmit` + seam `npm test` 86/86 + `npm run build` pass)
- [x] **T4** (`S5`, `S6`) — 24h Timeline default primary view, pinned scrubber, honest weekend mode, accurate legend, `App.tsx` wiring, `AmbientBackground` & dead-code/copy cleanup + full verification | Route: `inline` (cross-component integration & seam check) | Risk: `none` | Status: done (`f04f7c6`, RED → GREEN 87/87 tests, `npm run build` pass, `GREP_CLEAN`)
- [x] **T5** (`S2`–`S6`) — Live Chrome & static UX/UI, responsive, timeline alignment, and accessibility polish | Route: `inline` (approved audit fixes across 19 files) | Risk: `none` | Status: done (`20da510`, RED 3 fails → GREEN 88/88 tests across 8 files, `npm run build` pass)

## Log

- **L1 (2026-11-19)**: User request verbatim:
  - `"Actualmente mi app no me convence, la siento confusa, que no aporta info de fácil acceso y poco intuitiva. Critíca la app y dime que quita/agregar."`
  - `"Si, haz todo eso. Vamos!"`
- **L2 (2026-11-19)**: Created branch `feat/ux-clarity-redesign` from `main` (`b11ca36`). Verified baseline `npm test`: 76/76 passing.
- **L3 (2026-11-19)**: Completed `T1` (`54e789a`). Independent verifier caught 2 blockers on `002dd93` (multi-day weekday transitions missing `CL` suffix; Chile spring-forward DST `2026-09-06` `refDayEnd` spillover); fixed both in one correction batch with 3 regression probes; targeted recheck returned PASS on `S1` (86/86 tests + build green). Launching `T2` and `T3` in parallel with disjoint surfaces.
- **L4 (2026-11-19)**: Accepted and committed `T2` (`828f669`) and `T3` (`1f9f357`) after verifying disjoint edit surfaces and running seam `npm test` (86/86) + `npm run build` (green). Starting `T4` inline.
- **L5 (2026-11-19)**: Completed `T4` (`f04f7c6`, +532/-1,111 lines). Retired `TradingWindowsRadar.tsx` and `usePullToRefresh.ts`; promoted 24h `TimelineGrid` as primary view with pinned scrubber (`shouldClearScrubberOnLeave` RED → GREEN), honest weekend banner + reference simulation toggle, accurate `TimelineLegend`, calmed `AmbientBackground`, and unified neutral Spanish copy (`GREP_CLEAN`). Final checks: `npm test` 87/87 passing (8 files), `npm run build` clean (CSS 69.13 kB, precache 658.78 KiB). Total branch delta (`b11ca36..f04f7c6`): 29 files, +2,401/-1,759 lines across 4 work-unit commits (`54e789a`, `828f669`, `1f9f357`, `f04f7c6`); delivery strategy `ask-on-risk` remains local until user authorizes push/PR/merge.
- **L6 (2026-11-19)**: Completed `T5` (`20da510`, 19 files, +453/-225 lines) resolving all High, Medium, and Minor UX/UI, responsive, alignment, keyboard/ARIA, and copy findings from live Chrome evaluation (`6b3423e7-edd8-43f6-8953-851bc2fe529e`) and static audit (`13ca8a7b-4210-4bf2-83ce-18845820ecd9`). Key fixes: `resolveScrubberCancelState` + `ArrowUp`/`ArrowDown` & synchronous `handleKeyDown`, `UpcomingHoliday.closeTimeChile`, `0px` timeline bar-to-grid horizontal alignment + mobile `min-w-[460px]` scroll + z-index hierarchy (`z-[12]`/`z-[14]`/`z-[15]`/`z-30`/`z-40`), hour-tick collision fading (`<11%`), 1024px 3-col `MarketCards` (`xl:grid-cols-5`) & non-breaking `CL`/date tokens, `AlertsPopover` focus trap & `top` clamping, scoped `aria-modal="true"` scroll-lock cleanup, weekend banner `nextReopenLabel` (`dom 21:00 CL`), and proper Spanish date casing. Verified `npm test` 88/88 passing (8 files) and `npm run build` clean (CSS 68.90 kB, precache 661.32 KiB). Dispatching live Chrome re-verification (`6b3423e7-edd8-43f6-8953-851bc2fe529e`).
- **L7 (2026-11-19)**: Live Chrome re-verification (`6b3423e7-edd8-43f6-8953-851bc2fe529e`) passed 6/7 areas (0 console errors, 0 horizontal overflow across 1440/1024/768/390/320px, 0.00px bar alignment) and flagged 2 minor mobile edge polishes. User authorized: `"ajusta, mergea y luego sube los cambios"`. Applied mobile timeline adjustments in `2690f1d` (widened floating pill event clearance `< 14%` in `TimelineBars.tsx` + auto-centered horizontal scroll around `AHORA` on mount/today in `TimelineGrid.tsx`). Verified `npm test` 88/88 passing (8 files) and `npm run build` clean (CSS 68.90 kB, precache 661.71 KiB). Proceeding to merge into `main` and push to `origin/main`.
