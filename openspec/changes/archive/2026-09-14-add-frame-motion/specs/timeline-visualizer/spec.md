# Delta for timeline-visualizer

## MODIFIED Requirements

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
