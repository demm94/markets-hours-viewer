# Delta for timeline-visualizer

## MODIFIED Requirements

### Requirement: Synchronized Interactive Scrubber

The visualizer MUST render a synchronized vertical scrubber line traversing all market tracks when the user moves a pointer or performs a touch drag across the timeline, isolating horizontal drag gestures from vertical document scrolling.
(Previously: Defined generic pointer tracking without touch-action gesture isolation)

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
