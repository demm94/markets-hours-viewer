# pwa-shell Specification

## Purpose

Defines application shell layout, dark-mode financial theming, and Progressive Web App (PWA) installation and offline caching requirements.

## Requirements

### Requirement: Responsive Dashboard Layout and Theming

The application shell MUST provide a responsive viewport container tailored for desktop monitors and mobile devices with a dark financial theme.

#### Scenario: Header and Reference Info
- GIVEN the application loads in any viewport
- WHEN header is rendered
- THEN it MUST display the reference date and time in `America/Santiago`
- AND it MUST display current active UTC offset indicator (e.g. "UTC-3 (Horario de Verano)")

#### Scenario: Mobile Viewport Adaptation
- GIVEN viewport width below 768px
- WHEN timeline and market list are rendered
- THEN track rows MUST allow horizontal scrolling or fit with legible touch-friendly scrubber bounds
- AND status cards MUST stack cleanly without horizontal overflow

### Requirement: PWA Capabilities and Offline Caching

The application MUST provide valid Web App Manifest attributes and service worker caching for offline standalone execution.

#### Scenario: Web App Manifest Configuration
- GIVEN client browser requests manifest
- WHEN `/manifest.webmanifest` is served
- THEN `display` MUST be `standalone`
- AND `theme_color` and `background_color` MUST match the dark theme background
- AND icons for 192x192 and 512x512 MUST be specified

#### Scenario: Offline Shell Availability
- GIVEN user installs or visits the PWA while online
- WHEN connection goes offline and page is refreshed
- THEN the application shell and static assets MUST load from service worker cache without network error
- AND timezone calculations MUST continue to function offline using bundled IANA data
