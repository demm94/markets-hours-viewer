# Proposal: Add Framer Motion Animations & Micro-Interactions

## Intent

Enhance perceived polish and tactile feedback across the financial dashboard PWA by introducing hardware-accelerated animations for market cards, status transitions, and timeline column toggling using Motion (Framer Motion) while preserving 60 FPS scrubber performance.

## Scope

### In Scope
- Install and configure `motion` / `framer-motion` with React 19 compatibility.
- Smooth spring entrance animations and status transition badges for `MarketCards`.
- Fluid animated layout transitions (`layout` prop) when expanding or collapsing the timeline left column.
- Tactile press micro-interactions on pills, buttons, and scrubber controls.
- Strict support for `prefers-reduced-motion` accessibility.

### Out of Scope
- Animating the high-frequency scrubber crosshair line with Framer Motion (remains direct pure React / CSS to preserve 60Hz drag response).
- Adding 3D WebGL or Canvas canvas visualizers.

## Capabilities

### New Capabilities
None

### Modified Capabilities
- `pwa-shell`: Animated layout transitions, status badge feedback, and reduced-motion support.
- `timeline-visualizer`: Animated left column collapse and expand transitions.

## Approach

1. Integrate `motion` (modern lightweight Framer Motion) ensuring clean tree-shaking and zero peer conflicts with React 19.
2. Upgrade `MarketCards` with staggered entrance springs and subtle pulse transitions on status updates.
3. Replace CSS transitions on `TimelineGrid` left column with declarative `motion.div` layout animations.
4. Keep the timeline scrub bar strictly on GPU-composited CSS transforms, bypassing Framer Motion during active drags.
5. Benchmark bundle size and verify mobile frame rate stability.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `package.json` | Modified | Add `motion` dependency |
| `src/components/MarketCards.tsx` | Modified | Add motion entrance and badge transitions |
| `src/components/TimelineGrid.tsx` | Modified | Animated column collapse/expand |
| `src/components/Header.tsx` | Modified | Gentle live status pulse animation |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Bundle size inflation on mobile PWA | Medium | Use `motion` core with tree-shaking; monitor chunk sizes in `vite build` |
| Animation overhead during scrub | Low | Isolate Framer Motion strictly from scrubber drag state |
| Motion sickness / accessibility | Low | Honor `prefers-reduced-motion` natively via Motion |

## Rollback Plan

Revert git commit and package installation. All UI remains fully functional with static CSS fallbacks.

## Dependencies

- `motion` (Framer Motion) library.

## Success Criteria

- [ ] Smooth 60 FPS transitions on card render and column toggling.
- [ ] Timeline scrubbing responsiveness remains completely unimpaired.
- [ ] All automated tests pass and production bundle builds with valid PWA manifest.
