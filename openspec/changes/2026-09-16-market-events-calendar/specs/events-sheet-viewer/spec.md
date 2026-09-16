# events-sheet-viewer Specification

## Purpose

Defines the presentation, filtering interaction, and accessibility behaviors for the responsive events viewer drawer / sheet, displaying upcoming macroeconomic announcements without cluttering the primary timeline grid.

## Requirements

### Requirement: Responsive Drawer Presentation

The events viewer MUST render as a non-blocking or easily dismissible modal/sheet adapted to the user's viewport.

#### Scenario: Mobile Viewport Bottom Sheet
- GIVEN a mobile viewport (<= 768px)
- WHEN the user taps the events calendar trigger button
- THEN the events viewer MUST slide in smoothly from the bottom or right as an overlay
- AND tapping the backdrop or the close button MUST dismiss the sheet
- AND the primary scroll MUST be constrained to the sheet body

#### Scenario: Desktop Viewport Panel
- GIVEN a desktop viewport (> 768px)
- WHEN the events viewer is opened
- THEN it MUST present as an accessible slide-over drawer or dialog panel with minimum 400px width
- AND pressing the `Escape` key MUST close the viewer

### Requirement: Interactive Market and Importance Filters

The events viewer MUST provide intuitive, accessible filter controls to narrow down announcements.

#### Scenario: Market Filtering
- GIVEN the events viewer is open
- WHEN the user selects a market filter tab or chip (e.g., "EE.UU." or "Corea del Sur")
- THEN only events belonging to the selected market MUST be displayed
- AND selecting "Todos" MUST show events across all 5 monitored markets

#### Scenario: Importance Toggle
- GIVEN the events viewer is open
- WHEN the user toggles the high-importance filter
- THEN events with `importance === 'medium'` MUST be hidden
- AND only events with `importance === 'high'` MUST remain visible

### Requirement: Event Card Presentation and Legibility

Each event in the list MUST clearly contrast its importance level, time relative to Chile, and category.

#### Scenario: Event Card Visual Indicators
- GIVEN an upcoming event in the list
- WHEN rendered inside an event card
- THEN a high-importance event MUST display a prominent high-contrast badge (e.g. red/crimson)
- AND a medium-importance event MUST display an amber/orange badge
- AND the card MUST display the event title, category label, Chilean date/time, and exchange local date/time
- AND when `forecast` or `previous` data are present, they MUST be displayed in a compact tabular format
