# Proposal: Modernize UI with shadcn/ui Design System & Primitives

## Intent

Modernize the application UI by establishing a composable, accessible design system architecture inspired by `shadcn/ui`. We introduce core utility primitives (`cn`, `cva`, `clsx`, `tailwind-merge`), accessible headless component primitives (`Button`, `Badge`, `Card`), and standardized dark-financial theme tokens seamlessly wired into Tailwind CSS v4 and Framer Motion, enhancing maintainability and aesthetics while safeguarding 60 FPS mobile performance.

## Scope

### In Scope
- Install foundational styling and headless primitives: `clsx`, `tailwind-merge`, `class-variance-authority`, `@radix-ui/react-slot`.
- Implement `src/lib/utils.ts` with standard `cn()` class merging utility.
- Declare shadcn design system tokens (background, foreground, card, primary, secondary, muted, border, ring) in `src/index.css` mapped to Tailwind CSS v4 theme system.
- Build clean, accessible, and performant UI primitive components in `src/components/ui/`:
  - `Button` (with variants: default, outline, ghost, destructive, size options)
  - `Badge` (with variants: default, secondary, outline, open, lunch, pre, closed)
  - `Card` (`Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`)
- Modernize application components ([Header.tsx](file:///c:/Users/Diego/Desktop/Cosas/proyectos-personales/markets-pwa/src/components/Header.tsx), [MarketCards.tsx](file:///c:/Users/Diego/Desktop/Cosas/proyectos-personales/markets-pwa/src/components/MarketCards.tsx), [TimelineGrid.tsx](file:///c:/Users/Diego/Desktop/Cosas/proyectos-personales/markets-pwa/src/components/TimelineGrid.tsx)) to adopt these primitives.
- Preserve 60 FPS interactive timeline scrubbing, mobile touch ergonomics (>= 44px), and PWA offline capabilities.

### Out of Scope
- Rewriting the high-performance 24-hour canvas/timeline math engine or timezone calculation logic.
- Introducing heavy runtime CSS-in-JS libraries or bloated component frameworks.

## Capabilities

### Modified Capabilities
- `pwa-shell`: Enhanced with shadcn/ui primitive design system, standardized component tokens, and accessible interactive primitives.

## Approach

1. Install `clsx`, `tailwind-merge`, `class-variance-authority`, and `@radix-ui/react-slot` via npm.
2. Establish `src/lib/utils.ts` providing `cn(...)`.
3. Add `@theme` tokens in `src/index.css` for clean shadcn utility alignment (`bg-card`, `text-card-foreground`, `border-border`, etc.) harmonized with dark financial colors.
4. Construct atomic UI components in `src/components/ui/`:
   - `button.tsx` with CVA variants and `Slot` polymorphism.
   - `badge.tsx` with financial market status styling (`open`, `lunch`, `pre`, `closed`).
   - `card.tsx` with high-contrast borders and backdrop glassmorphism.
5. Refactor [Header.tsx](file:///c:/Users/Diego/Desktop/Cosas/proyectos-personales/markets-pwa/src/components/Header.tsx), [MarketCards.tsx](file:///c:/Users/Diego/Desktop/Cosas/proyectos-personales/markets-pwa/src/components/MarketCards.tsx), and [TimelineGrid.tsx](file:///c:/Users/Diego/Desktop/Cosas/proyectos-personales/markets-pwa/src/components/TimelineGrid.tsx) to consume `Card`, `Badge`, and `Button`.
6. Verify test suite (`npm run test`), production build (`npm run build`), and SDD status with `gentle-ai`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `package.json` | Modified | Add `clsx`, `tailwind-merge`, `class-variance-authority`, `@radix-ui/react-slot` |
| `src/lib/utils.ts` | New | Provide `cn` helper function |
| `src/index.css` | Modified | Add design tokens for shadcn theme integration |
| `src/components/ui/` | New | Add `button.tsx`, `badge.tsx`, `card.tsx` |
| `src/components/Header.tsx` | Modified | Use `Badge` for market status counter |
| `src/components/MarketCards.tsx` | Modified | Use `Card` and `Badge` primitives |
| `src/components/TimelineGrid.tsx` | Modified | Use `Button` and `Badge` for toggles, now button, and legend items |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Peer dependency warnings with React 19 | Medium | Check package compatibility, verify build and runtime behavior |
| Performance overhead from extra component layers in timeline | Low | Keep timeline scrubber canvas/DOM lightweight, use memoization |

## Rollback Plan

Revert component imports to direct Tailwind utility classes and remove `src/components/ui/` and newly installed dependencies.

## Dependencies

- `clsx`
- `tailwind-merge`
- `class-variance-authority`
- `@radix-ui/react-slot`

## Success Criteria

- [ ] Core utility `cn` and dependencies installed and functioning.
- [ ] `Button`, `Badge`, and `Card` components implemented in `src/components/ui/`.
- [ ] Components refactored to utilize shadcn primitives cleanly.
- [ ] Production build succeeds (`npm run build`) and all 15 tests pass (`npm run test`).
