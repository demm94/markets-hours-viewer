import React from 'react';
import { DateTime } from 'luxon';
import { Activity } from 'lucide-react';
import { getSantiagoOffsetDescription } from '../core/timezone';

interface HeaderProps {
  now: DateTime;
  timeFormatted: string;
  dateFormatted: string;
  openMarketsCount: number;
  totalMarketsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  now,
  timeFormatted,
  dateFormatted,
  openMarketsCount,
  totalMarketsCount
}) => {
  const santiagoOffset = getSantiagoOffsetDescription(now);

  return (
    <header className="app-header">
      <div className="header-brand">
        <img src="/favicon.svg" alt="Markets View Logo" className="header-logo" />
        <span className="header-app-name">Markets View</span>
        <div className="header-open-badge">
          <Activity size={12} className="animate-pulse text-emerald-400" />
          <span>
            <strong>{openMarketsCount}</strong>/{totalMarketsCount} abiertos
          </span>
        </div>
      </div>

      <div className="header-clock-strip">
        <div className="header-clock-location">
          <span className="live-dot" />
          <span className="location-name">Santiago</span>
        </div>

        <span className="header-clock-time">{timeFormatted}</span>
        <span className="header-offset-chip">{santiagoOffset}</span>
        <span className="header-clock-date">{dateFormatted}</span>
      </div>
    </header>
  );
};
