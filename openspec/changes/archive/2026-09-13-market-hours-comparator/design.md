# Design: Market Hours Comparator Technical Architecture

## Technical Approach

A modular, component-driven client-side application using Vite, React, and TypeScript. The application core is divided into a headless, pure domain layer for IANA timezone computations (`src/core/`) and a declarative presentation layer (`src/components/`) utilizing CSS hardware-accelerated transforms for the crosshair scrubber.

## Architecture Decisions

| Decision | Choice | Alternatives Considered | Rationale |
|:---|:---|:---|:---|
| **Timezone Engine** | `luxon` | Native `Intl`, `date-fns-tz`, `dayjs` | Luxon provides first-class IANA zone arithmetic, built-in DST offset inspection, and stable immutable `DateTime` objects. |
| **Coordinate System** | Normalized Minute Space (0-1440 min = 0-100%) | Canvas rendering, fixed pixel grids | Percentage-based DOM elements allow responsive auto-scaling across all device widths without canvas DPI rescaling or re-rendering artifacts. |
| **Scrubber State** | Shared Pointer Context / Custom Hook | Full canvas redraw, global Zustand store | Lightweight React hook isolates cursor minute offset; CSS absolute left percentage provides 60fps tracking on pointer/touch drag. |
| **PWA Provider** | `vite-plugin-pwa` | Manual Workbox script, vanilla Service Worker | Zero-config manifest generation and auto-updating service worker lifecycle baked into Vite build pipeline. |

## Data Flow

```
[System Clock (1m tick)] ──> useCurrentTime Hook ──> Santiago Current Time (DateTime)
                                                                 │
[User Hover / Touch Drag] ──> useScrubber Hook ────> Scrubber Minute (0-1440)
                                                                 │
                                                                 ▼
[Market Configurations] ──> timezone.ts Projection ──> Normalized Timeline Segments
                                                                 │
                                                                 ▼
                                                [TimelineGrid & Scrubber Overlay]
```

## File Changes

| File | Action | Description |
|:---|:---|:---|
| `package.json` | Create | Project manifest with Vite, React 19, TS, Luxon, Lucide, Vitest. |
| `vite.config.ts` | Create | Vite config with React plugin and `VitePWA` setup. |
| `src/core/types.ts` | Create | TypeScript interfaces for Markets, Sessions, Segments, and Statuses. |
| `src/core/markets.ts` | Create | Static definition of Taiwan, Korea, China, India, US, and Chile metadata. |
| `src/core/timezone.ts` | Create | Pure IANA timezone conversion, interval projection, and status evaluation. |
| `src/core/timezone.test.ts` | Create | Unit tests validating DST transitions, wraps, and session splits. |
| `src/hooks/useCurrentTime.ts`| Create | Interval hook maintaining live Santiago time and minute position. |
| `src/hooks/useScrubber.ts` | Create | Pointer/touch event listener tracking 0-1440 minute timeline coordinate. |
| `src/components/Header.tsx` | Create | Top bar showing current Chile time, active UTC offset, and market counts. |
| `src/components/MarketCards.tsx`| Create| Quick-status summary cards for each exchange. |
| `src/components/TimelineGrid.tsx`| Create| Stacked 24-hour horizontal track visualizer. |
| `src/components/TrackRow.tsx` | Create | Individual market row with colored session blocks and status badge. |
| `src/components/Scrubber.tsx` | Create | Full-height crosshair line and dynamic position tooltip badge. |
| `src/App.tsx` | Create | Root application container wiring hooks to presentation components. |
| `src/index.css` | Create | Dark-mode financial palette, custom scrollbars, and grid styling. |

## Interfaces / Contracts

```typescript
export type SessionType = 'regular' | 'lunch' | 'pre_market';
export type MarketStatus = 'open' | 'lunch' | 'pre_market' | 'closed';

export interface SessionConfig {
  type: SessionType;
  start: string; // "HH:mm" in exchange local timezone
  end: string;   // "HH:mm" in exchange local timezone
}

export interface MarketConfig {
  id: string;
  name: string;
  code: string;
  country: string;
  flag: string;
  timezone: string; // IANA zone string (e.g., 'Asia/Seoul')
  sessions: SessionConfig[];
}

export interface TimelineSegment {
  type: SessionType;
  startMinute: number; // 0-1440 relative to Chile day
  endMinute: number;   // 0-1440 relative to Chile day
}

export interface MarketTrackData {
  market: MarketConfig;
  segments: TimelineSegment[];
  currentStatus: MarketStatus;
  scrubberTimeFormatted: string;
  scrubberStatus: MarketStatus;
}
```

## Testing Strategy

| Layer | Target | Approach |
|:---|:---|:---|
| **Unit** | `src/core/timezone.ts` | Vitest testing DST conversions (Santiago UTC-3/4 vs NY UTC-4/5), Asian session wrap across midnight, and China lunch break. |
| **Integration** | `TimelineGrid` + `useScrubber` | Test scrubber hover and touch interactions mapping to exact minute intervals. |
| **PWA Verification** | Service Worker & Manifest | Validate manifest JSON and service worker registration during production build. |

## Threat Matrix

`N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.`

## Migration / Rollout

No migration required. Greenfield single-page application.

## Open Questions

None. Architecture and dependencies fully defined.
