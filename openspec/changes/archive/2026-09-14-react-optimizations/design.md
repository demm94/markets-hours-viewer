# Design: React Rendering & Scrubbing Performance Optimizations

## Technical Approach

Introduce strict render boundaries and reference stability to achieve jank-free 60 FPS scrubber tracking and eliminate redundant re-renders during 1-second clock ticks. The strategy uses pure React primitives (`React.memo`, `useMemo`, `useCallback`) without external dependencies or structural breaking changes.

## Architecture Decisions

| Decision Area | Options Considered | Tradeoffs | Decision & Rationale |
|---------------|-------------------|-----------|----------------------|
| **Render Isolation** | 1. External state store (Zustand)<br>2. React Context<br>3. `React.memo` on top-level components | Zustand adds a runtime dependency. Context causes sub-tree re-renders unless split into many providers. | **Option 3 (`React.memo`)**: Zero new dependencies, preserves simple props-down container pattern, immediately shields `Header` and static subtrees from scrubber pointer events. |
| **Static Geometry Allocation** | 1. Inline generation in render<br>2. Hoisting static constants outside components | Inline arrays create GC pressure during 60Hz pointer moves. | **Option 2 (Hoisted Constants)**: Move `HOURS` (13 ticks) and Chile anchor objects to module scope to eliminate allocations during drag. |
| **Component Cleanup** | 1. Keep unused `TrackRow.tsx`<br>2. Delete `TrackRow.tsx`<br>3. Refactor rows into `TrackRow` | `TimelineGrid` uses split columns (`timeline-left-column` vs `timeline-bars-container`). `TrackRow` combined them into a single flex row that breaks horizontal scrolling. | **Option 2 (Delete `TrackRow.tsx`)**: Remove orphaned file to keep the codebase clean and avoid confusion. |
| **Callback Stabilization** | 1. Inline handlers in JSX<br>2. `useCallback` in hooks and `App.tsx` | Inline handlers break shallow prop comparisons in `React.memo`. | **Option 2 (`useCallback`)**: Stabilize pointer handlers and slider events across all render cycles. |

## Data Flow

```
Clock Tick (1s)                Scrubber Drag (60Hz)
      │                                │
      ▼                                ▼
useCurrentTime (App)          useScrubber (App)
      │                                │
  [now updates]               [scrubberMinutes updates]
      │                                │
      ├───────────┐                    ├───────────┐
      ▼           ▼                    ▼           ▼
   Header     TimelineGrid        MarketCards   TimelineGrid
  (Re-renders) (Re-renders "Now") (Memo check) (Scrubber line moves)
      │                                │
MarketCards (Idle)               Header (Skipped via React.memo)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/components/Header.tsx` | Modify | Wrap in `React.memo` to skip re-rendering during scrubbing. |
| `src/components/MarketCards.tsx` | Modify | Wrap in `React.memo` with shallow props comparison. |
| `src/components/TimelineGrid.tsx` | Modify | Wrap in `React.memo`, hoist static constants (`HOURS`, `CHILE_MARKET`), memoize internal sub-calculations. |
| `src/components/TrackRow.tsx` | Delete | Remove orphaned, unused component. |
| `src/App.tsx` | Modify | Stabilize callbacks and memoize prop inputs to prevent cascading renders. |

## Interfaces / Contracts

No public TypeScript types are modified. All components maintain their existing prop interfaces:

```typescript
export const Header: React.FC<HeaderProps> = React.memo((props) => { ... });
export const MarketCards: React.FC<MarketCardsProps> = React.memo((props) => { ... });
export const TimelineGrid: React.FC<TimelineGridProps> = React.memo((props) => { ... });
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Existing timezone & timeline calculations | Run `npm test` to ensure zero regressions in domain logic. |
| Verification | Component render stability | Add a unit test verifying `Header` and `MarketCards` do not re-render when unrelated props change. |
| Manual / E2E | Scrubber responsiveness & 60 FPS | Profile pointer dragging across the timeline with Chrome DevTools Performance monitor. |

## Threat Matrix

`N/A - no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.`

## Migration / Rollout

No migration required. Changes are fully internal to the React component tree and backwards-compatible.

## Open Questions

None. Architecture and scope are completely determined.
