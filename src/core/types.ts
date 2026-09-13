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

export interface MarketEvaluation {
  marketId: string;
  status: MarketStatus;
  localTimeFormatted: string;
  localDateFormatted: string;
  activeSegmentLabel?: string;
}
