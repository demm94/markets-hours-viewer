# Design: Framer Motion Animations & Ergonomic Micro-Interactions

## Technical Approach

Introduce `framer-motion` to elevate the PWA's tactile aesthetics with spring-based physics and layout transitions while strictly isolating high-frequency timeline scrubbing from animation runtime overhead.

## Architecture Decisions

| Decision Area | Options Considered | Tradeoffs | Decision & Rationale |
|---------------|-------------------|-----------|----------------------|
| **Animation Engine** | 1. `framer-motion` (v13)<br>2. CSS-only keyframes<br>3. `gsap` | CSS lacks dynamic spring physics and layout morphing. GSAP has licensing constraints and larger footprint. | **Option 1 (`framer-motion`)**: Declarative React integration, built-in layout transitions (`layout`), automatic `prefers-reduced-motion` support, zero peer conflicts with React 19. |
| **Scrubber Separation** | 1. Animate scrubber with Motion<br>2. Keep scrubber on raw CSS transforms | Motion springs on 60Hz pointer moves introduce frame lag and feel unresponsive while dragging. | **Option 2 (CSS Scrubber)**: Scrubber line remains driven by raw CSS transforms with zero animation engine overhead for instant 60Hz tracking. |
| **Market Cards Animation** | 1. Global continuous loop<br>2. Staggered entrance + interactive tap springs | Continuous loops drain mobile battery. | **Option 2 (Entrance + Interaction)**: Mount stagger (`0.05s` delay between cards) plus `whileHover` (`scale: 1.02`) and `whileTap` (`scale: 0.98`) micro-interactions. |
| **Accessibility Policy** | 1. Manual media query hooks<br>2. Framer Motion `useReducedMotion()` | Manual hooks require custom boilerplate. | **Option 2 (`useReducedMotion`)**: Native hook disables springs and transitions when the user prefers reduced motion. |

## Data Flow

```
Page Mount / State Change           User Touch / Tap
           │                                │
           ▼                                ▼
MarketCards (Stagger Variants)     Interactive Buttons / Cards
           │                                │
           ├────────────────────────────────┤
           ▼                                ▼
GPU-Accelerated Compositor (transform: scale/translate, opacity)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `package.json` | Modify | Install `framer-motion` dependency. |
| `src/components/MarketCards.tsx` | Modify | Add `motion.div` containers, stagger variants, and hover/tap micro-interactions. |
| `src/components/TimelineGrid.tsx` | Modify | Add `motion.button` press feedback to toggle and "AHORA" buttons; smooth column layout transitions. |
| `src/components/Header.tsx` | Modify | Add gentle spring pulse on the live status dot and open market counter. |

## Interfaces / Contracts

Animation variants contract:

```typescript
export const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.04,
      type: 'spring',
      stiffness: 300,
      damping: 25
    }
  })
};
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Component mount and render contracts | Verify all components render correctly and existing 14 tests pass. |
| Bundle | Production bundle size impact | Run `npm run build` and ensure vendor chunk remains optimized. |
| Accessibility | Reduced-motion fallback | Verify animations bypass spring delays when reduced motion is detected. |

## Threat Matrix

`N/A - no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.`

## Migration / Rollout

No migration required. Pure additive UI enhancement.

## Open Questions

None. Package version, component boundaries, and accessibility fallbacks are fully specified.
