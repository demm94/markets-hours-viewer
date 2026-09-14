# Proposal: Integrate Tailwind CSS v4

## Intent

Incorporate Tailwind CSS v4 into the project using the official `@tailwindcss/vite` plugin to provide utility-first styling capabilities alongside the existing custom CSS design system, leveraging modern CSS-first configuration and the lightning-fast Rust Oxide engine without legacy PostCSS or `tailwind.config.js` overhead.

## Scope

### In Scope
- Install `tailwindcss` (v4) and `@tailwindcss/vite` as development dependencies.
- Configure `vite.config.ts` with the `@tailwindcss/vite` plugin.
- Add `@import "tailwindcss";` to `src/index.css` to load the utility layers.
- Verify compatibility with existing custom CSS variables, Framer Motion animations, and PWA manifest/service worker precaching.
- Ensure build chunk sizes and 60 FPS performance remain within targets.

### Out of Scope
- Rewriting all existing handcrafted CSS components into Tailwind utility classes immediately (this proposal provides the infrastructure and setup).
- Installing legacy PostCSS or Tailwind v3 plugins (`autoprefixer`, `postcss.config.js`).

## Capabilities

### New Capabilities
None

### Modified Capabilities
- `pwa-shell`: Modernized styling build pipeline supporting Tailwind CSS v4 utility classes.

## Approach

1. Install `tailwindcss` and `@tailwindcss/vite` using `npm install -D tailwindcss @tailwindcss/vite`.
2. Update `vite.config.ts` to include `tailwindcss()` from `@tailwindcss/vite`.
3. Prepend `@import "tailwindcss";` in `src/index.css` ensuring existing custom styles and tokens coexist harmoniously.
4. Verify that Vite dev server and production build (`npm run build`) compile cleanly without CSS collisions.
5. Execute Vitest test suite (`npm run test`) to ensure zero functional regressions.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `package.json` | Modified | Add `tailwindcss` and `@tailwindcss/vite` to `devDependencies` |
| `vite.config.ts` | Modified | Register `@tailwindcss/vite` plugin |
| `src/index.css` | Modified | Import Tailwind CSS v4 engine |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| CSS Preflight reset colliding with custom PWA base styles | Low | Test base styling and verify reset doesn't alter dark background or typography |
| Production bundle size inflation | Low | Tailwind v4 Oxide compiler only emits classes actually used |

## Rollback Plan

Uninstall `@tailwindcss/vite` and `tailwindcss`, remove the plugin from `vite.config.ts`, and revert `src/index.css`.

## Dependencies

- `tailwindcss` (v4)
- `@tailwindcss/vite`

## Success Criteria

- [ ] Tailwind CSS v4 installed and registered in `vite.config.ts`.
- [ ] `@import "tailwindcss";` cleanly compiles in `src/index.css`.
- [ ] Tailwind utilities (e.g. `flex`, `grid`, `text-*`) work as expected in JSX components.
- [ ] Production build succeeds (`npm run build`) and passes all 15 tests (`npm run test`).
