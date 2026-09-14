# Delta for pwa-shell

## MODIFIED Requirements

### Requirement: Responsive Dashboard Layout and Theming

The application shell MUST provide a mobile-first responsive viewport container with dark financial theming, native safe-area inset adaptation for mobile devices (360px–480px), ergonomic touch targets (>= 44px), uncompromised market status readability without squished or truncated text, and native Tailwind CSS v4 utility-first styling pipeline support.
(Previously: Responsive dashboard layout and theming with mobile-first container, safe-area insets, and ergonomic touch targets without Tailwind CSS utility pipeline integration.)

#### Scenario: Tailwind CSS v4 Compilation and Utility Availability
- GIVEN the application styling pipeline is built with Vite
- WHEN `src/index.css` is processed with `@import "tailwindcss";`
- THEN Tailwind CSS v4 utility classes (e.g. typography, layout, spacing, flexbox/grid) MUST be available for use across JSX components
- AND the utility engine MUST only emit used classes in the production bundle without bloating dead CSS

#### Scenario: Coexistence with Custom Design Tokens
- GIVEN the existing dark financial theme custom properties (`--bg-main`, `--color-open`, `--safe-top`, etc.)
- WHEN Tailwind CSS v4 is active in the build
- THEN existing custom variables and hand-crafted component styles MUST remain fully functional without reset collisions
