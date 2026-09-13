import React from 'react';
import { DateTime } from 'luxon';
import { Globe, RotateCcw, Activity } from 'lucide-react';
import { getSantiagoOffsetDescription } from '../core/timezone';

interface HeaderProps {
  now: DateTime;
  timeFormatted: string;
  dateFormatted: string;
  openMarketsCount: number;
  totalMarketsCount: number;
  isScrubbing: boolean;
  onResetScrubber: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  now,
  timeFormatted,
  dateFormatted,
  openMarketsCount,
  totalMarketsCount,
  isScrubbing,
  onResetScrubber
}) => {
  const santiagoOffset = getSantiagoOffsetDescription(now);

  return (
    <header className="app-header">
      <div className="header-left">
        <div className="app-badge">
          <Globe size={16} className="text-emerald-400" />
          <span>Mercados vs. Chile</span>
        </div>
        <h1 className="header-title">Comparador de Horarios Bursátiles</h1>
        <p className="header-subtitle">
          Proyección en tiempo real de bolsas asiáticas y estadounidenses contra el horario local de Chile.
        </p>
      </div>

      <div className="header-right">
        <div className="clock-card">
          <div className="clock-header">
            <span className="live-dot" />
            <span className="clock-location">Santiago de Chile</span>
            <span className="offset-tag">{santiagoOffset}</span>
          </div>
          <div className="clock-time">{timeFormatted}</div>
          <div className="clock-date">{dateFormatted}</div>
        </div>

        <div className="status-summary-bar">
          <div className="open-pill">
            <Activity size={14} className="animate-pulse text-emerald-400" />
            <span>
              <strong>{openMarketsCount}</strong> de {totalMarketsCount} mercados abiertos ahora
            </span>
          </div>

          {isScrubbing && (
            <button
              onClick={onResetScrubber}
              className="reset-btn"
              title="Volver a la hora actual de Chile"
            >
              <RotateCcw size={13} />
              <span>Volver a Ahora</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
