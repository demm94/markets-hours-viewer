# Tasks: Mobile-First Refactor & UI Design Overhaul

## Phase 1: Mobile-First Design Tokens & Safe Areas

- [x] 1.1 Add iOS/Android PWA safe-area CSS environment variables (`--safe-top`, `--safe-bottom`, etc.) and fluid typography/spacing clamp tokens to `src/index.css`.
- [x] 1.2 Update `src/App.tsx` container and layout wrapper to respect safe area insets and eliminate mobile horizontal overflow.

## Phase 2: Market Cards Touch-Snap Carousel

- [x] 2.1 Refactor `src/components/MarketCards.tsx` and CSS to implement a horizontal snap-scroll container (`scroll-snap-type: x mandatory`) on mobile viewports (< 768px).
- [x] 2.2 Restore full market information on mobile cards: display flag, country, market code, status badge, local time, and date with crisp typography and subtle card peek.
- [x] 2.3 Implement progressive enhancement `@media (min-width: 768px)` and `@media (min-width: 1024px)` to render standard multi-column grid on larger screens.

## Phase 3: Mobile App Bar & Fluid Header

- [x] 3.1 Refactor `src/components/Header.tsx` layout and styling with fluid typography (`clamp()`) to prevent awkward line breaks on narrow mobile viewports (360px–480px).
- [x] 3.2 Polish the live pulse indicator, Santiago UTC offset badge, and open market counter into a unified financial mobile app bar.

## Phase 4: Thumb-Zone Timeline Navigation & Touch Targets

- [x] 4.1 Update `src/components/TimelineGrid.tsx` slider bar: elevate touch target size to >= 44px for the "Ahora" button, increase thumb slider draggable hit area, and position within the natural thumb zone.
- [x] 4.2 Enforce strict gesture isolation (`touch-action`) on the timeline scroll wrapper and scrubber interaction zone to eliminate vertical bounce conflicts.
- [x] 4.3 Adapt timeline legend layout on mobile screens (< 480px) into a clean, multi-column wrap with high contrast indicator dots.

## Phase 5: Verification & Quality Assurance

- [x] 5.1 Run test suite (`npm run test`) to ensure all timezone engine and render isolation tests pass without regression.
- [x] 5.2 Execute production build (`npm run build`) and verify bundle sizes and PWA manifest generation.
- [x] 5.3 Validate changes with `gentle-ai sdd-verify-validate`.
