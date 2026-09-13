# Design: Responsive Design & Mobile Ergonomics Technical Architecture

## Technical Approach

Enhance mobile and tablet usability by introducing a CSS-driven frozen column table pattern for the 24-hour timeline, isolating touch drag gestures in `useScrubber` to eliminate mobile scroll conflicts, and implementing fluid responsive styling across header, summary cards, and controls.

## Architecture Decisions

| Decision | Choice | Alternatives Considered | Rationale |
|:---|:---|:---|:---|
| **Sticky Column Strategy** | Pure CSS `position: sticky; left: 0` with elevation shadow | JS scroll synchronizers, duplicate table split | CSS sticky provides native hardware-accelerated 60fps horizontal scrolling without layout jitter or scroll event listeners. |
| **Touch Gesture Isolation** | Conditional `touch-action: none` + pointer capture in `useScrubber` | Global viewport lock, passive touch listeners | Isolates horizontal scrubber tracking exclusively while user touches the bar surface, allowing natural vertical page scroll elsewhere. |
| **Card Compaction** | Fluid CSS Grid `minmax(145px, 1fr)` with dense spacing | Horizontal card carousel, collapsible accordions | Compact grid keeps all 5 markets visible at a glance on small mobile screens without requiring extra user swipes. |
| **Typography Scaling** | CSS `clamp()` tokens for titles and clocks | Static pixel breakpoints | Smooth fluid text scaling between 360px and 1280px prevents awkward line wrapping on iPhone SE / small Android devices. |

## Data Flow & Gesture Isolation

```
[Touch Surface Event]
        │
        ├── Touch on Document Body ────────> Native Vertical Page Scrolling
        │
        └── Touch on Timeline Bars
                 │
                 ├── Active Drag (isDragging=true) ──> touch-action: none (Zero scroll jitter)
                 │                                      └──> Updates scrubberMinutes (0-1440)
                 │
                 └── Touch Release ──────────────────> Resumes standard pointer capture
```

## File Changes

| File | Action | Description |
|:---|:---|:---|
| `src/index.css` | Modify | Add `position: sticky` on `.timeline-left-column`, fluid clamp typography, compact card styling, and mobile breakpoints (<480px, <768px). |
| `src/hooks/useScrubber.ts` | Modify | Enhance pointer capture and touch event management to prevent document scroll conflicts during timeline drags. |
| `src/components/Header.tsx` | Modify | Adapt clock card and action buttons to flex gracefully on ultra-narrow viewports. |
| `src/components/MarketCards.tsx` | Modify | Add compact density modifier classes for narrow screens. |
| `src/components/TimelineGrid.tsx` | Modify | Add sticky elevation classes and touch gesture bindings. |

## Interfaces / Contracts

```typescript
// Updated useScrubber state contracts ensuring gesture safety
export interface UseScrubberResult {
  scrubberMinutes: number;
  isHovering: boolean;
  isDragging: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
  handlePointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  handlePointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
  handlePointerUp: (e: React.PointerEvent<HTMLDivElement>) => void;
  handlePointerLeave: () => void;
  resetToNow: () => void;
  setScrubberMinutes: (minutes: number | null) => void;
}
```

## Testing Strategy

| Layer | Target | Approach |
|:---|:---|:---|
| **Unit** | `src/core/timezone.test.ts` & `timeline-visualizer.test.ts` | Ensure existing test suite remains green with 0 regressions. |
| **Visual / Responsive Verification** | Mobile (375px), Tablet (768px), Desktop (1280px) | Verify sticky left column, lack of horizontal body overflow, and touch drag smoothness. |
| **Production Build** | `npm run build` | Validate TypeScript compilation and asset bundling. |

## Threat Matrix

`N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.`

## Migration / Rollout

No migration required. Pure frontend layout and interaction enhancement.

## Open Questions

None. Approach is CSS/hook focused.
