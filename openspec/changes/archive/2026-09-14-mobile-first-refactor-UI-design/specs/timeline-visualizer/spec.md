# Delta for timeline-visualizer

## MODIFIED Requirements

### Requirement: Stacked 24-Hour Timeline Grid Presentation

The visualizer MUST render stacked horizontal tracks sharing a normalized 00:00 to 24:00 Chile reference time axis with mobile-optimized thumb-zone navigation controls, touch-friendly sticky market identity column, and a responsive legend layout.
(Previously: The visualizer rendered stacked tracks with layout animation transitions during column toggle without dedicated thumb-zone navigation or mobile legend adaptation.)

#### Scenario: Thumb-Zone Navigator and Center Button
- GIVEN mobile touchscreen viewport (<= 768px)
- WHEN the 24-hour viewport navigator bar is displayed
- THEN the slider track and "Ahora" action button MUST sit in the lower screen thumb zone
- AND the "Ahora" button MUST feature a minimum 44px touch target with tactile tap animation
- AND dragging the thumb slider MUST smoothly pan the timeline horizontally with immediate visual feedback

#### Scenario: Mobile Collapsed Sticky Column Optimization
- GIVEN mobile touchscreen viewport (<= 768px)
- WHEN the timeline is rendered with the left market column collapsed
- THEN the column MUST remain sticky at 52px width displaying vibrant country flags
- AND live converted market times MUST display cleanly on the persistent "Now" line or scrubber crosshair overlay without visual collision

#### Scenario: Responsive Mobile Legend Formatting
- GIVEN viewport width below 480px
- WHEN timeline status legend is displayed
- THEN legend items MUST wrap into a compact 2-column or fluid grid with touch-friendly spacing
- AND color indicators MUST maintain high-contrast legibility against the dark background

### Requirement: Synchronized Interactive Scrubber

The visualizer MUST render a synchronized vertical scrubber line traversing all market tracks when the user moves a pointer or performs a touch drag across the timeline, isolating horizontal drag gestures from vertical document scrolling with explicit touch gestures handling.
(Previously: Synchronized scrubber line traversing market tracks without explicit touch-action CSS guarantees.)

#### Scenario: Touch Drag Conflict Prevention
- GIVEN mobile touchscreen viewport
- WHEN user places finger on the timeline grid to drag the scrubber line
- THEN `touch-action` MUST prevent accidental browser pull-to-refresh or vertical page jump during horizontal dragging
- AND lifting finger MUST finalize scrubber state cleanly without sticking or ghost pointer capture
