# Delta for pwa-shell

## MODIFIED Requirements

### Requirement: Responsive Dashboard Layout and Theming

The application shell MUST provide a responsive viewport container tailored for desktop monitors and mobile devices with a dark financial theme, ensuring compact layout scaling on narrow screens (< 480px) and render isolation between live clock ticks and user interactions.
(Previously: Responsive dashboard layout and theming without explicit render isolation between clock ticks and scrub interactions.)

#### Scenario: Header and Reference Info
- GIVEN the application loads in any viewport
- WHEN header is rendered
- THEN it MUST display the reference date and time in `America/Santiago`
- AND it MUST display current active UTC offset indicator (e.g. "UTC-3 (Horario de Verano)")

#### Scenario: Mobile Viewport Adaptation
- GIVEN viewport width below 768px
- WHEN timeline and market list are rendered
- THEN track rows MUST allow horizontal scrolling while keeping the left market column visible and sticky
- AND status cards MUST scale down or wrap cleanly into a 2-column or fluid grid without horizontal page overflow

#### Scenario: Ultra-compact Mobile Viewports (< 480px)
- GIVEN mobile viewport width below 480px
- WHEN the dashboard is displayed
- THEN header title and clock MUST stack vertically with fluid typography
- AND market cards MUST display compact metrics without text truncation

#### Scenario: Root Render Isolation on Clock Ticks and Interactions
- GIVEN the dashboard is rendered with live time ticks and interactive timeline
- WHEN 1-second clock ticks occur
- THEN components with unchanged inputs MUST NOT re-render
- AND WHEN timeline scrubbing occurs
- THEN the header and unaffected market summary cards MUST NOT re-render unless displayed status values actually mutate
