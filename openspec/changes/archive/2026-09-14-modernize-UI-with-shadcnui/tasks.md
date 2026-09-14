# Tasks: Modernize UI with shadcn/ui

## Phase 1: Foundation & Dependencies

- [x] 1.1 Install `clsx`, `tailwind-merge`, `class-variance-authority`, and `@radix-ui/react-slot`.
- [x] 1.2 Create `src/lib/utils.ts` and export the standard `cn` merging helper function.
- [x] 1.3 Add shadcn semantic CSS theme variables to `src/index.css`.

## Phase 2: Primitive Components (`src/components/ui/`)

- [x] 2.1 Implement `Button` component in `src/components/ui/button.tsx` supporting standard variants and sizes.
- [x] 2.2 Implement `Badge` component in `src/components/ui/badge.tsx` with dedicated market status variants (`open`, `lunch`, `pre`, `closed`).
- [x] 2.3 Implement `Card` compound components (`Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`) in `src/components/ui/card.tsx`.

## Phase 3: Component Modernization

- [x] 3.1 Refactor `src/components/Header.tsx` to use `Badge` for market status readout.
- [x] 3.2 Refactor `src/components/MarketCards.tsx` to use `Card` and `Badge` primitives while preserving Framer Motion animations.
- [x] 3.3 Refactor `src/components/TimelineGrid.tsx` to use `Button` for scrubber actions and `Badge` for timeline indicators.

## Phase 4: Verification & Validation

- [x] 4.1 Run unit test suite (`npm run test`) to confirm zero regressions.
- [x] 4.2 Execute production build (`npm run build`) and confirm clean bundle generation.
- [x] 4.3 Validate and verify change with `gentle-ai sdd-verify-validate`.
