# Proposal: Mobile-First Refactor & UI Design Overhaul

## Intent

Refactor and modernize the application's interface with a strict mobile-first architecture and premium financial aesthetics. While desktop usability is maintained, the primary viewport target becomes mobile devices (360px–480px) and tablets (768px), delivering thumb-zone ergonomics, native-feeling touch gestures, safe-area inset compliance (iOS/Android notches and home bars), and uncompromised readability of market statuses without cramped or truncated text.

## Scope

### In Scope
- **Mobile-First Layout & Safe Area Insets**: Refactor container padding and viewport sizing to adhere to `env(safe-area-inset-*)` on mobile standalone PWAs (notches, dynamic islands, navigation bars).
- **Market Cards Mobile Presentation**: Replace the cramped, squished 5-column ticker row with an ergonomic, touch-friendly horizontal snap-carousel (or responsive fluid cards) that displays full market names, flags, status badges, and local times without clipping.
- **Thumb-Zone Timeline Navigation**: Redesign the timeline navigator, slider, and "Ahora" button to sit ergonomically in the bottom thumb zone with tactile >= 44px touch targets.
- **Enhanced Scrubber Touch Experience**: Improve touch drag isolation between timeline horizontal scrubbing and vertical page scroll with visible haptic/visual feedback.
- **Refined Mobile Typography & Glassmorphic Polish**: Update hierarchy, contrasting status indicators, and subtle glassmorphism conforming to high-end financial dashboard design standards.
- **Desktop Graceful Scaling**: Ensure the mobile-first CSS architecture fluidly scales up into multi-column desktop views with min/max clamps.

### Out of Scope
- Modifying underlying IANA timezone calculation logic or Luxon projection algorithms.
- Adding complex chart candle visualizers or third-party charting libraries (TradingView widgets, Canvas).
- Multi-language localization beyond existing Spanish locale strings.

## Capabilities

### New Capabilities
None

### Modified Capabilities
- `pwa-shell`: Viewport container, safe area insets, mobile header hierarchy, and responsive layout styling tokens.
- `timeline-visualizer`: Mobile scrubber touch interactions, thumb-zone controls, sticky collapsed column optimization, and legend layout on mobile.

## Approach

1. **Audit & Design System Modernization**:
   - Establish fluid CSS variables (`clamp()`) for typography and spacing tailored for 360px–480px screens up to 4K monitors.
   - Incorporate iOS/Android PWA safe-area variables (`env(safe-area-inset-top)`, `env(safe-area-inset-bottom)`).
2. **Component Refactoring**:
   - **Header**: Refactor into a clean, modern mobile app bar with Santiago live time, UTC-3 badge, and open market counter aligned cleanly without vertical clutter.
   - **MarketCards**: Transform the squished mobile view into a smooth CSS scroll-snap carousel with scroll hint/indicators and spring animations on card tap.
   - **TimelineGrid**: Optimize the sticky market column (52px icons) with crisp flag indicators and scrubber readout pills, optimize the 24h timeline track height, and position the zoom/scrubber slider with prominent thumb targets.
   - **Controls & Actions**: Provide a dedicated bottom-floating or sticky action pill for quick "Centrar en Ahora" (Center on Now) action.
3. **Automated & Visual Verification**:
   - Verify mobile viewports (360px, 390px, 412px, 768px, 1280px).
   - Ensure touch gestures work seamlessly without scroll-jacking or accidental refresh triggers.
   - Run Vitest test suite and production build.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/index.css` | Major | Mobile-first CSS refactor, design tokens, safe area insets, snap carousel, responsive media queries |
| `src/components/Header.tsx` | Modified | Compact mobile app bar layout with fluid typography |
| `src/components/MarketCards.tsx` | Modified | Touch-friendly snap-carousel / card layout with full metrics visibility |
| `src/components/TimelineGrid.tsx` | Modified | Thumb-friendly slider navigation, touch target enlargement, and mobile legend |
| `src/App.tsx` | Modified | Mobile viewport shell wrapper with safe area support |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Horizontal timeline scroll conflicting with mobile native page navigation | Medium | Enforce `touch-action: pan-y` on scroll containers and isolate pointer drag events |
| Card snap carousel overflowing document boundary | Low | Use standard CSS `scroll-snap-type: x mandatory` with padding gutters |
| Desktop visual regression | Low | Apply mobile-first `@media (min-width: ...)` progressive enhancement |

## Rollback Plan

Revert to previous git commit (`101a5ae`). The previous styling and component layout remain completely isolated and intact in version history.

## Dependencies

- Existing dependencies (`react`, `framer-motion`, `lucide-react`, `luxon`). No additional external libraries required.

## Success Criteria

- [ ] Clear readability of all market names, statuses, and times on mobile screens (>= 360px).
- [ ] No horizontal document scrolling or unwanted layout overflow.
- [ ] Touch targets on interactive buttons and slider thumb meet accessibility guidelines (>= 44px).
- [ ] Safe-area padding respected when running as an installed PWA.
- [ ] All automated tests pass (`npm run test`) and production bundle builds cleanly (`npm run build`).
