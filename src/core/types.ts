export type SessionType = 'regular' | 'lunch' | 'pre_market';
export type MarketStatus = 'open' | 'lunch' | 'pre_market' | 'closed';

export interface SessionConfig {
  type: SessionType;
  start: string; // "HH:mm" in exchange local timezone
  end: string;   // "HH:mm" in exchange local timezone
  label?: string;
}

export interface MarketConfig {
  id: string;
  name: string;
  code: string;
  country: string;
  flag: string;
  timezone: string; // IANA zone string (e.g., 'Asia/Seoul')
  sessions: SessionConfig[];
  notes?: string;
}

export interface TimelineSegment {
  type: SessionType;
  startMinute: number; // 0-1440 relative to reference day in Chile
  endMinute: number;   // 0-1440 relative to reference day in Chile
  label?: string;
}

export interface MarketTransition {
  type: 'open' | 'close' | 'lunch' | 'resume';
  inMinutes: number;
  formattedCountdown: string;
}

export interface MarketHoliday {
  marketId: string;
  date: string; // YYYY-MM-DD
  name: string;
}

export interface MarketEvaluation {
  marketId: string;
  status: MarketStatus;
  localTimeFormatted: string;
  localDateFormatted: string;
  timezoneOffset?: string;
  activeSegmentLabel?: string;
  nextTransition?: MarketTransition;
  holiday?: MarketHoliday;
}

export type EventImportance = 'medium' | 'high';

export type EventCategory =
  | 'central_bank'
  | 'inflation'
  | 'gdp'
  | 'employment'
  | 'holidays';

export interface MarketEvent {
  id: string;
  marketId: string; // 'nyse' | 'twse' | 'krx' | 'sse' | 'nse' | 'chile'
  title: string;
  description?: string;
  category: EventCategory;
  importance: EventImportance;
  timestampUtc: string; // ISO 8601 (e.g., '2026-09-17T18:00:00Z')
  forecast?: string;
  previous?: string;
}

export interface FormattedMarketEvent extends MarketEvent {
  chileTimeFormatted: string;
  exchangeTimeFormatted: string;
  relativeTimeDescriptor: string;
}

export interface TimelineEventMarkerData extends FormattedMarketEvent {
  minuteInChile: number; // 0-1440
  leftPercent: number;   // (minuteInChile / 1440) * 100
}
