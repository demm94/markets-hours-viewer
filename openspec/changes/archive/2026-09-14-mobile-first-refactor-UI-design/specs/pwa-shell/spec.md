# Delta for pwa-shell

## MODIFIED Requirements

### Requirement: Responsive Dashboard Layout and Theming

The application shell MUST provide a mobile-first responsive viewport container with dark financial theming, native safe-area inset adaptation for mobile devices (360px–480px), ergonomic touch targets (>= 44px), and uncompromised market status readability without squished or truncated text, while progressively enhancing up to multi-column desktop displays.
(Previously: Responsive dashboard layout and theming with render isolation, spring animations, and compact layout scaling on narrow screens without native safe-area insets or dedicated mobile snap presentation.)

#### Scenario: Native Safe-Area Inset Handling
- GIVEN the application is installed as a PWA or running in a mobile browser with screen cutouts (notch, dynamic island, bottom home indicator)
- WHEN the app layout is rendered
- THEN top padding MUST incorporate `env(safe-area-inset-top, 0px)` to avoid overlapping system status bars
- AND bottom padding MUST incorporate `env(safe-area-inset-bottom, 0px)` to prevent navigation collision with system gesture bars

#### Scenario: Mobile-First Header Hierarchy
- GIVEN mobile viewport width between 360px and 480px
- WHEN header is rendered
- THEN branding, live Santiago clock, UTC offset, and open markets counter MUST be arranged in a balanced mobile app bar without vertical overflow
- AND font sizing MUST use fluid typography (`clamp()`) to ensure zero horizontal wrapping or truncation

#### Scenario: Touch-Friendly Market Cards Presentation
- GIVEN mobile viewport width below 768px
- WHEN market cards are rendered
- THEN cards MUST be presented in a smooth, touch-scrollable horizontal snap container (`scroll-snap-type: x mandatory`)
- AND each card MUST display full country name, market code, flag, color-coded status badge, and converted local time without hiding or truncating text
- AND active snap cards MUST provide visual scroll cue / peek for adjacent cards

#### Scenario: Touch Target Accessibility Compliance
- GIVEN user interacts with interactive elements on mobile (buttons, toggles, slider handles)
- WHEN user taps or drags an interactive element
- THEN the effective touch target area MUST measure at least 44px by 44px
- AND touchable controls MUST provide immediate tactile spring/scale feedback

#### Scenario: Desktop Graceful Scale-Up
- GIVEN desktop viewport (width >= 1024px)
- WHEN dashboard is displayed
- THEN market cards MUST display in a 5-column fluid grid
- AND layout spacing MUST expand proportionally without horizontal stretching distortion
