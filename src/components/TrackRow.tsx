import React from 'react';
import { MarketConfig, MarketEvaluation, TimelineSegment } from '../core/types';

interface TrackRowProps {
  market: MarketConfig;
  segments: TimelineSegment[];
  scrubberEvaluation: MarketEvaluation;
  scrubberMinutes: number;
  isChileAnchor?: boolean;
}

export const TrackRow: React.FC<TrackRowProps> = ({
  market,
  segments,
  scrubberEvaluation,
  scrubberMinutes,
  isChileAnchor = false
}) => {
  const isSegmentActiveAtScrubber = (seg: TimelineSegment) => {
    return scrubberMinutes >= seg.startMinute && scrubberMinutes < seg.endMinute;
  };

  const status = scrubberEvaluation.status;
  let statusBadgeClass = 'status-closed';
  let statusLabel = 'Cerrado';

  if (isChileAnchor) {
    statusBadgeClass = 'status-reference';
    statusLabel = 'Referencia';
  } else if (status === 'open') {
    statusBadgeClass = 'status-open';
    statusLabel = 'Abierto';
  } else if (status === 'lunch') {
    statusBadgeClass = 'status-lunch';
    statusLabel = 'Almuerzo';
  } else if (status === 'pre_market') {
    statusBadgeClass = 'status-pre';
    statusLabel = 'Pre-apertura';
  }

  return (
    <div className={`track-row ${isChileAnchor ? 'track-row-anchor' : ''}`}>
      {/* Left Info Column */}
      <div className="track-info">
        <div className="track-identity">
          <span className="track-flag">{market.flag}</span>
          <div className="track-names">
            <span className="track-name">{market.name}</span>
            <span className="track-code">{market.code}</span>
          </div>
        </div>

        <div className="track-scrubber-peek">
          <span className="track-scrubber-time">{scrubberEvaluation.localTimeFormatted}</span>
          <span className={`status-badge-compact ${statusBadgeClass}`}>
            {statusLabel}
          </span>
        </div>
      </div>

      {/* Right 24h Bar Track */}
      <div className="track-bar-container">
        <div className="track-bar-bg">
          {/* Hour markers subtle background ticks */}
          {Array.from({ length: 25 }).map((_, i) => (
            <div
              key={i}
              className={`track-hour-tick ${i % 3 === 0 ? 'tick-major' : ''}`}
              style={{ left: `${(i / 24) * 100}%` }}
            />
          ))}

          {/* Render Active Segments */}
          {segments.map((seg, idx) => {
            const leftPercent = (seg.startMinute / 1440) * 100;
            const widthPercent = ((seg.endMinute - seg.startMinute) / 1440) * 100;
            const active = isSegmentActiveAtScrubber(seg);

            return (
              <div
                key={idx}
                className={`session-block session-${seg.type} ${active ? 'session-scrubber-active' : ''}`}
                style={{
                  left: `${leftPercent}%`,
                  width: `${widthPercent}%`
                }}
                title={`${seg.label ?? seg.type}: ${(seg.startMinute / 60).toFixed(1)}h - ${(seg.endMinute / 60).toFixed(1)}h (Chile)`}
              >
                {widthPercent > 5 && (
                  <span className="session-label">
                    {seg.label ?? (seg.type === 'regular' ? 'Abierto' : seg.type)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
