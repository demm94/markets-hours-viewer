# Proposal: Responsive Design & Mobile Ergonomics Enhancement

## Intent

Optimize layout ergonomics and touch interactions for mobile viewports (360px–768px) and tablets, ensuring the timeline grid, sticky market columns, and header cards remain legible, accessible, and fluid across all screen sizes.

## Scope

### In Scope
- Mobile-first layout refinements for `Header`, `MarketCards`, and `TimelineGrid`.
- Sticky column scroll anchoring allowing horizontal timeline scrubbing without viewport jank.
- Compact view mode for market cards on small mobile screens (< 480px).
- Refined touch drag handling preventing inadvertent vertical screen scrolling while scrubbing.
- Responsive typography and spacing tokens.

### Out of Scope
- Native mobile app wrapper (Capacitor/Cordova).
- Re-architecting the 0–1440 minute calculation engine.
- Landscape-only forced orientations.

## Capabilities

### New Capabilities
None

### Modified Capabilities
- `pwa-shell`: Mobile layout adaptation, compact card views, and responsive header ergonomics.
- `timeline-visualizer`: Touch-action constraints and sticky left column scroll preservation.

## Approach

1. Add `touch-action: pan-y` and explicit touch handlers to `TimelineGrid` to isolate horizontal scrubbing from vertical page scrolling.
2. Make `timeline-left-column` stick seamlessly while the timeline bars container scrolls horizontally on narrow mobile screens.
3. Optimize `MarketCards` into compact 2-column or carousel layout on viewports under 480px.
4. Scale font sizes and paddings with CSS clamp / media queries for high-density phone screens.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/index.css` | Modified | Responsive breakpoints, clamp font sizes, sticky table positioning. |
| `src/components/Header.tsx` | Modified | Compact layout when viewport < 600px. |
| `src/components/MarketCards.tsx` | Modified | Compact status card rendering on mobile viewports. |
| `src/components/TimelineGrid.tsx` | Modified | Touch event isolation and sticky column enhancements. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Mobile touch scroll conflict | Medium | Apply `touch-action: none` specifically to interactive bar area during active touch drag. |
| Sticky column shadow clipping | Low | Use CSS sticky with explicit z-index and box-shadow separators. |

## Rollback Plan

Revert `src/index.css` and affected component files via git (`git checkout`).

## Dependencies

None (pure CSS and React component refinements).

## Success Criteria

- [ ] Mobile viewports (360px+) display header, clock, and cards without horizontal overflow.
- [ ] Timeline horizontally scrolls smoothly with the left market column remaining visible.
- [ ] Dragging the scrubber on mobile does not trigger accidental vertical page scrolling.
- [ ] Tested and verified across mobile (375px), tablet (768px), and desktop (1280px).
