# Design: Tailwind CSS v4 Integration

## Architectural Context

The application currently uses a centralized Vanilla CSS architecture in `src/index.css` with CSS custom properties and Framer Motion animations. To accelerate rapid UI prototyping, micro-utilities, and future component development, we integrate Tailwind CSS v4.

Tailwind CSS v4 is configured CSS-first:
- Zero JS configuration (`tailwind.config.js` is deprecated in v4).
- Dedicated Vite plugin `@tailwindcss/vite` leveraging Rust-based Oxide compiler.
- Direct `@import "tailwindcss";` in `src/index.css`.

```mermaid
graph TD
    A[Vite 6 Build Engine] --> B[@tailwindcss/vite Plugin]
    B --> C[Rust Oxide Scanner]
    C --> D[Scan JSX/TSX Source Code]
    D --> E[Generate Atomic Utility CSS]
    E --> F[Vite CSS Pipeline + Rollup Chunks]
    F --> G[PWA Precache Bundle]
```

## Architectural Decisions

### 1. Official Vite Plugin `@tailwindcss/vite`
- **Decision**: Use `@tailwindcss/vite` instead of legacy PostCSS CLI or PostCSS plugin.
- **Rationale**: Built directly for Vite 6, integrates with Vite's module graph, supports instant HMR, and doesn't require extra PostCSS config files.

### 2. Coexistence with Custom Design System
- **Decision**: Keep existing custom properties (`--bg-main`, `--color-open`, etc.) and component styles in `src/index.css`, placing `@import "tailwindcss";` at the top of the stylesheet.
- **Rationale**: Allows progressive adoption without needing an abrupt, risky rewrite of the verified timeline and card layout systems.

### 3. Verification Strategy
- Validate build execution (`npm run build`).
- Verify existing tests pass (`npm run test`).
- Ensure no reset styling conflicts disrupt dark theme background or custom font rendering.
