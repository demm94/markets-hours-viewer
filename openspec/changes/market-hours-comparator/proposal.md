# Proposal: Market Hours Comparator PWA

## Intent

Provide Chilean traders and investors a real-time stock market trading hours visualizer comparing Taiwan (TWSE), South Korea (KRX), China (SSE/SZSE), India (NSE/BSE), and US (NYSE/NASDAQ) against Chile local time (`America/Santiago`), handling dynamic DST transitions via IANA timezone conversions without hardcoded offsets.

## Scope

### In Scope
- Setup Vite + React + TypeScript project with PWA capabilities.
- IANA timezone calculation engine using `luxon` mapping market sessions to Chilean reference day (24h).
- Market data configuration for 5 key exchanges plus Chile reference bar.
- Stacked 24-hour timeline visualization with distinct visual states (open, closed, lunch, pre-market).
- Synchronized interactive vertical scrubber (pointer hover and touch drag) across all rows.
- Dynamic "Now" indicator updating every minute with automatic market status detection.
- Mobile-responsive layout and dark mode theme.

### Out of Scope
- Market holidays and ad-hoc closures (deferred to V2).
- Multi-market overlap highlight engine (deferred to V2).
- Price streaming and market data feeds (out of scope).
- Push notifications / alarm alerts (deferred to V2).

## Capabilities

### New Capabilities
- `market-timezone-engine`: Pure IANA conversion translating international market sessions to reference time offsets.
- `timeline-visualizer`: Multi-track 24-hour synchronized timeline bars with crosshair scrubber and status cards.
- `pwa-shell`: Installable progressive web application shell with offline asset caching and responsive container.

### Modified Capabilities
None

## Approach

1. Initialize Vite React TypeScript project with `luxon` and Lucide icons.
2. Structure domain models and time calculation utilities in `src/core/` with comprehensive unit tests for DST transitions.
3. Build declarative presentational components for timeline tracks, session intervals, and synchronized scrubber pointer tracking.
4. Add service worker and manifest configuration for offline PWA installation.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `package.json` | New | Project dependencies (Vite, React, TypeScript, Luxon, PWA plugin). |
| `src/core/` | New | Pure timezone projection and market session logic. |
| `src/components/` | New | Timeline visualizer, market tracks, scrubber crosshair, status cards. |
| `src/App.tsx` | New | Top-level dashboard coordinator and timer hook. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Asymmetric DST shifts (Chile vs US) | Medium | Strict use of Luxon IANA timezone identifiers instead of fixed numeric offsets. |
| Scrubber touch lag on mobile | Low | Pointer events with CSS hardware acceleration and minimal DOM reflows. |

## Rollback Plan

Delete workspace code files (`src/`, `package.json`) and reset repository to clean git initial state.

## Dependencies

- `luxon`, `@types/luxon`
- `vite-plugin-pwa`
- `lucide-react`

## Success Criteria

- [ ] All 5 international markets accurately project sessions onto 00:00-24:00 Chile time.
- [ ] Vertical scrubber dynamically inspects equivalent local times across all exchanges simultaneously.
- [ ] Current time line tracks accurate real-time market open/closed status.
- [ ] Application installs cleanly as a PWA and runs offline.
