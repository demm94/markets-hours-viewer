# timeline-visualizer Specification

## Purpose

Defines the presentation, synchronization, and interaction behavior for the stacked 24-hour market trading timeline visualizer, including the crosshair scrubber and live real-time marker.

## Requirements

### Requirement: Stacked 24-Hour Timeline Grid Presentation

The visualizer MUST render stacked horizontal tracks sharing a normalized 00:00 to 24:00 Chile reference time axis with fluid layout animation transitions when expanding or collapsing the left market identity column.
(Previously: The visualizer rendered stacked horizontal tracks without explicit layout animation transitions during column toggle.)

#### Scenario: Visual Ordering and Layout
- GIVEN the visualizer is loaded
- WHEN the tracks are rendered
- THEN the Chile anchor reference track MUST be fixed at the top with labeled hour intervals
- AND foreign market tracks (Taiwan, South Korea, China, India, United States) MUST be stacked below it in consistent alignment

#### Scenario: Visual Interval Color Coding
- GIVEN a market track with calculated intervals
- WHEN rendered on screen
- THEN open market segments MUST display in green (high contrast)
- AND lunch break or pre-market segments MUST display in amber/orange
- AND closed hours MUST display in dark muted slate

#### Scenario: Animated Column Width Transition
- GIVEN the timeline table is displayed
- WHEN the user toggles the left column between collapsed (icons only) and expanded states
- THEN the column width transition MUST animate smoothly using layout animation without breaking horizontal track alignment
- AND timeline scrubbing during or after the transition MUST continue to track accurately
### Requirement: Synchronized Interactive Scrubber

The visualizer MUST render a synchronized vertical scrubber line traversing all market tracks when the user moves a pointer or performs a touch drag across the timeline, isolating horizontal drag gestures from vertical document scrolling and maintaining high-frequency render isolation without re-rendering unaffected visual subtrees.
(Previously: The visualizer rendered a synchronized vertical scrubber line isolating drag gestures without explicit render isolation guarantees or frame budget constraints.)

#### Scenario: Desktop Hover Scrubber Tracking
- GIVEN desktop viewport
- WHEN the user hovers pointer over the timeline at offset corresponding to 14:30 Chile time
- THEN a vertical crosshair line MUST span vertically across all market tracks at 14:30
- AND each market track MUST display its corresponding converted local time and active status at that point

#### Scenario: Mobile Touch Scrubber Drag
- GIVEN mobile touchscreen viewport
- WHEN the user touches and drags horizontally along the timeline
- THEN the scrubber line MUST track touch position with low-latency updates
- AND tapping a point on the track MUST set the scrubber position immediately

#### Scenario: Active Session Highlight
- GIVEN the scrubber position intersects an open trading window for an exchange
- WHEN rendered
- THEN the active trading block for that exchange MUST visually highlight
- AND its status indicator MUST reflect `open`

#### Scenario: Touch Drag Gesture Isolation
- GIVEN mobile touchscreen viewport
- WHEN the user initiates and maintains a touch drag gesture across the timeline surface
- THEN horizontal scrubber movements MUST NOT trigger unexpected vertical page scrolling or document panning
- AND releasing touch MUST safely end the drag interaction without sticky pointer capture leaks

#### Scenario: High-Frequency Scrubber Render Isolation
- GIVEN user drags or hovers the scrubber across the timeline
- WHEN pointer move events fire at high frequency (up to 60+ Hz)
- THEN timeline track rows and DOM subtrees MUST NOT trigger unneeded re-calculations of static segments
- AND scrubber line tracking MUST sustain a smooth 60 FPS frame rate
### Requirement: Real-Time "Now" Indicator

The visualizer MUST display a persistent indicator marking the current real-time minute on the Chilean axis.

#### Scenario: Live Position Rendering
- GIVEN current time is 11:15 in `America/Santiago`
- WHEN the timeline is displayed
- THEN a distinct vertical line (accent/vibrant, dashed or dotted) MUST be placed exactly at 11:15
- AND each market row badge MUST display whether the market is currently open at this real-time moment

#### Scenario: Automatic Position Increment
- GIVEN the application remains open
- WHEN one minute elapses
- THEN the "Now" indicator position MUST automatically update to the new minute without requiring a manual page refresh
