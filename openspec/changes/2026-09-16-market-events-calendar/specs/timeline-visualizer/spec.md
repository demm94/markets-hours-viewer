# timeline-visualizer Specification (Delta)

## Purpose

Extends the timeline visualizer and market status display with integrated event indicators, allowing users to trigger the event calendar viewer directly from market cards or the main header.

## Requirements

### Requirement: Market Card Event Indicators

The market cards and header MUST provide non-intrusive visual indicators when upcoming high-impact events are scheduled for that market.

#### Scenario: Mobile Condensed Card Indicator
- GIVEN a market card in the mobile 5-column condensed strip
- WHEN that market has an upcoming high-importance event within the next 48 hours
- THEN the card MUST render a subtle dot or badge indicator signaling an active catalyst
- AND tapping the card or its indicator MUST open the events drawer pre-filtered for that market

#### Scenario: Global Calendar Trigger in Header
- GIVEN the application top header
- WHEN rendered on desktop or mobile
- THEN an accessible calendar icon button labeled "Eventos" or "Calendario" MUST be visible
- AND tapping or clicking the button MUST open the events viewer with all markets selected
- AND when high-importance events are occurring today, the button MUST display an attention badge
