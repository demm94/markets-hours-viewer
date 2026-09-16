# economic-calendar-engine Specification

## Purpose

Defines the data structures, offline dataset, and query logic for macroeconomic announcements and catalysts across the 5 monitored stock exchanges, converting event timestamps to both Chilean local time (`America/Santiago`) and exchange local time.

## Requirements

### Requirement: Macroeconomic Event Data Model

The calendar engine MUST represent each announcement with an immutable structure containing identifier, market identifier, title, description, category, importance rating, and UTC timestamp.

#### Scenario: Event Structure and Attributes
- GIVEN a market event definition
- WHEN an event is modeled
- THEN it MUST include `id`, `marketId`, `title`, `category`, `importance`, and `timestampUtc`
- AND `importance` MUST be constrained to `'medium' | 'high'`
- AND `category` MUST be one of `'central_bank' | 'inflation' | 'gdp' | 'employment' | 'holidays'`
- AND it MAY optionally include `forecast` and `previous` values as strings

### Requirement: Timezone Conversion to Chile and Exchange Local Times

The calendar engine MUST convert UTC timestamps into Chilean local time (`America/Santiago`) and exchange local time using IANA timezone identifiers, accounting for active Daylight Saving Time shifts.

#### Scenario: Time Formatting for User Presentation
- GIVEN an event with a valid ISO UTC timestamp
- WHEN `formatEventTimes` is invoked with the event and reference date
- THEN it MUST return the formatted Chilean time (`HH:mm`, `dd/MM`) under `America/Santiago`
- AND it MUST return the formatted exchange local time (`HH:mm`, `dd/MM`) under the market's IANA timezone
- AND it MUST compute the time difference or relative descriptor relative to the current Chilean time

### Requirement: Event Querying, Filtering, and Sorting

The calendar engine MUST provide deterministic filtering and chronological sorting functions.

#### Scenario: Filter by Market and Importance
- GIVEN a collection of market events
- WHEN queried for a specific `marketId`
- THEN only events matching that market MUST be returned
- AND when filtered by `minImportance: 'high'`, only events with `importance === 'high'` MUST be returned
- AND returned events MUST be ordered chronologically ascending by `timestampUtc`

#### Scenario: Upcoming Events Query
- GIVEN the current time in Chile
- WHEN `getUpcomingEvents` is called with an optional time window
- THEN past events older than 24 hours MUST be excluded by default
- AND upcoming events occurring within the next 30 days MUST be returned sorted by proximity
