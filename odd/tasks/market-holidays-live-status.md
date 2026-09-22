# Feature: Market Holidays & Live Status Evaluation

**Workflow:** ODD (Organic Driven Development)
**Status:** Completed
**Created:** 2026-09-22

## Goal

Incorporate official stock exchange holidays into the live market evaluation engine so that markets closed for holidays are correctly reflected in real time across Market Cards, the 24h Timeline, and the Events Drawer, with automated yearly syncing via GitHub Actions.

## Frozen decisions (user-owned)

| Decision | Choice |
| --- | --- |
| Live state integration | Feriado sets `status: 'closed'` with `activeSegmentLabel: 'Feriado: [Nombre]'` |
| UI Representation | Market Cards show holiday badge; timeline row reflects holiday state |
| Data automation | Unified into existing monthly GitHub Actions workflow with Finnhub `/stock/market-holiday` |
| Fallback/Offline | Static dataset in `src/data/holidays.json` for reliable offline PWA operation |

## Tasks

### Phase 1 — Data & Model
- [x] 1.1 Add `MarketHoliday` interface and update `MarketEvaluation` in `src/core/types.ts`.
- [x] 1.2 Create `src/data/holidays.json` with official 2026/2027 holidays for NYSE, SSE, TWSE, KRX, NSE, and Chile.
- [x] 1.3 Implement helper functions in `src/core/holidays.ts` (`getMarketHoliday`, `isMarketHoliday`, `getUpcomingHolidays`).

### Phase 2 — Core Engine & Tests
- [x] 2.1 Update `evaluateMarketAt` in `src/core/timezone.ts` to detect holidays in local market timezone.
- [x] 2.2 Add unit tests in `src/core/holidays.test.ts` verifying holiday detection and state changes.

### Phase 3 — UI & Workflow Integration
- [x] 3.1 Display holiday badge and name in `MarketCards.tsx`.
- [x] 3.2 Update `TimelineBars.tsx` and `TimelineLeftColumn.tsx` to visually indicate holiday tracks and badges.
- [x] 3.3 Add segmented "Feriados Bursátiles" view in `EventsDrawer.tsx`.
- [x] 3.4 Update `scripts/sync-events.js` to fetch and update `src/data/holidays.json`.

### Phase 4 — Verification & Delivery
- [x] 4.1 Run Vitest suite (`npm test`) — 34/34 passing.
- [x] 4.2 Run production build (`npm run build`) — passing with zero errors.
