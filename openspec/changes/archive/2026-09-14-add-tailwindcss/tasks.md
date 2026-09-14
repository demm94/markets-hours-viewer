# Tasks: Tailwind CSS v4 Integration

## Phase 1: Dependency Installation & Vite Configuration

- [x] 1.1 Install `tailwindcss` (v4) and `@tailwindcss/vite` as development dependencies.
- [x] 1.2 Register `@tailwindcss/vite` plugin in `vite.config.ts`.

## Phase 2: Stylesheet Integration & Coexistence

- [x] 2.1 Add `@import "tailwindcss";` at the top of `src/index.css`.
- [x] 2.2 Verify that custom CSS variables (`--bg-main`, `--safe-top`, etc.) and component styles render identically without Preflight reset collision.

## Phase 3: Verification & Quality Assurance

- [x] 3.1 Run test suite (`npm run test`) to ensure zero regressions in calculations and render isolation.
- [x] 3.2 Execute production build (`npm run build`) and confirm PWA service worker generation and CSS chunk sizes.
- [x] 3.3 Validate change with `gentle-ai sdd-verify-validate`.
