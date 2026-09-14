# Delta for pwa-shell

## MODIFIED Requirements

### Requirement: Responsive Dashboard Layout and Theming

The application shell MUST provide a mobile-first responsive viewport container with dark financial theming, native safe-area inset adaptation for mobile devices (360px–480px), ergonomic touch targets (>= 44px), uncompromised market status readability without squished or truncated text, native Tailwind CSS v4 utility-first styling pipeline support, and accessible shadcn/ui primitive design system components.
(Previously: Responsive dashboard layout and theming with mobile-first container, safe-area insets, ergonomic touch targets, and Tailwind CSS v4 utility pipeline without shadcn/ui component primitive architecture.)

#### Scenario: shadcn/ui Component Primitives and Theme Tokens
- GIVEN the application styling pipeline with Tailwind CSS v4
- WHEN components render `Card`, `Badge`, or `Button` from `src/components/ui/`
- THEN the components MUST apply standardized semantic classes via `cn(...)` utility
- AND the components MUST support custom variant props via `class-variance-authority`
- AND interactive touch targets MUST satisfy minimum dimensions of 44px by 44px on mobile viewports

#### Scenario: Financial Status Badge Variants
- GIVEN a market status (`open`, `lunch`, `pre`, `closed`)
- WHEN a `Badge` primitive is rendered with the corresponding variant
- THEN the badge MUST display the specified status color indicator, background tint, and border glow
- AND the `open` status variant MUST display an animated activity pulse indicator

#### Scenario: Coexistence with Custom Design Tokens
- GIVEN the existing dark financial theme custom properties (`--bg-main`, `--color-open`, `--safe-top`, etc.)
- WHEN shadcn/ui semantic tokens and components are integrated into the build
- THEN existing custom variables and hand-crafted component styles MUST remain fully functional without reset collisions
