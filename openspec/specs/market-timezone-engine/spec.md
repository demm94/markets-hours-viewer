# market-timezone-engine Specification

## Purpose

Defines the computation rules for translating international stock exchange trading hours from native IANA timezones into the Chilean reference timeline (`America/Santiago`), supporting dynamic DST changes and split trading sessions.

## Requirements

### Requirement: Dynamic IANA Timezone Projection

The system MUST compute all market session conversions using official IANA timezone identifiers (`America/Santiago`, `America/New_York`, `Asia/Taipei`, `Asia/Seoul`, `Asia/Shanghai`, `Asia/Kolkata`) evaluated for a specific reference date, without fixed numeric hour offsets.

#### Scenario: NYSE Session Conversion during Chile DST (UTC-3)
- GIVEN a reference date in September 2026 where Chile is in UTC-3 (`America/Santiago`)
- AND NYSE trading session is 09:30 to 16:00 in `America/New_York` (EDT, UTC-4)
- WHEN the session is projected to Chile time
- THEN the projected start time MUST be 10:30 Chile time
- AND the projected end time MUST be 17:00 Chile time

#### Scenario: Asian Exchange Day Boundary Wrap
- GIVEN a reference date where Chile is in UTC-3
- AND TWSE trading session is 09:00 to 13:30 in `Asia/Taipei` (UTC+8)
- WHEN the session is projected to Chile time
- THEN the session MUST project to 22:00 (previous day) through 02:30 (current day) in Chile time
- AND the interval MUST correctly split across the 00:00 midnight boundary for 24h display

### Requirement: Multi-Segment Trading Sessions Support

The system MUST support exchanges with discontinuous sessions, including pre-market auctions and lunch breaks.

#### Scenario: China SSE / SZSE Lunch Break Discontinuity
- GIVEN Shanghai Stock Exchange (`Asia/Shanghai`) with morning (09:30-11:30), lunch break (11:30-13:00), and afternoon (13:00-15:00) sessions
- WHEN market intervals are computed for the day
- THEN the system MUST produce distinct segments marked as `regular` (09:30-11:30, 13:00-15:00) and `lunch` (11:30-13:00)
- AND the lunch break MUST NOT be classified as open market trading

#### Scenario: India NSE Pre-market Auction
- GIVEN National Stock Exchange of India (`Asia/Kolkata`) with pre-market from 09:00 to 09:15 and regular trading from 09:15 to 15:30
- WHEN market intervals are computed
- THEN the system MUST produce a `pre_market` segment from 09:00 to 09:15 local time
- AND a `regular` segment from 09:15 to 15:30 local time

### Requirement: Instantaneous Market Status Evaluation

The system MUST evaluate the operational status (`open`, `closed`, `lunch`, `pre_market`) of an exchange for any instant `t`.

#### Scenario: Status Query During Active Trading
- GIVEN an exchange whose regular trading session covers timestamp `t`
- WHEN the status is queried for timestamp `t`
- THEN the status MUST be `open`

#### Scenario: Status Query During Closed Hours
- GIVEN an exchange outside any scheduled session at timestamp `t`
- WHEN the status is queried for timestamp `t`
- THEN the status MUST be `closed`
