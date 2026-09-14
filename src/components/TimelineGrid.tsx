import React, { useState } from 'react';
import { MarketConfig, MarketEvaluation, TimelineSegment } from '../core/types';
import { CHILE_CONFIG } from '../core/markets';
import { formatMinutes } from '../core/timezone';
import { ChevronLeft, ChevronRight, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

interface TimelineGridProps {
  markets: MarketConfig[];
  marketSegments: Record<string, TimelineSegment[]>;
  scrubberEvaluations: Record<string, MarketEvaluation>;
  chileScrubberEvaluation: MarketEvaluation;
  scrubberMinutes: number;
  currentMinutes: number;
  isHovering: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerCancel?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerLeave: () => void;
}

export const TimelineGrid: React.FC<TimelineGridProps> = ({
  markets,
  marketSegments,
  scrubberEvaluations,
  chileScrubberEvaluation,
  scrubberMinutes,
  currentMinutes,
  isHovering,
  containerRef,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onPointerLeave
}) => {
  const hours = Array.from({ length: 13 }, (_, i) => i * 2); // 0, 2, 4, ... 24
  const scrubberPercent = (scrubberMinutes / 1440) * 100;
  const nowPercent = (currentMinutes / 1440) * 100;

  // Default to collapsed on mobile viewports (<= 768px) to maximize timeline space
  const [isColumnCollapsed, setIsColumnCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth <= 768;
    }
    return false;
  });

  const toggleColumn = () => setIsColumnCollapsed((prev) => !prev);

  const chileMarket: MarketConfig = {
    ...CHILE_CONFIG,
    sessions: []
  };

  const allMarkets = [chileMarket, ...markets];

  const getStatusBadge = (marketId: string, evaluation: MarketEvaluation) => {
    if (marketId === 'chile') {
      return <span className="status-badge-compact status-reference">Referencia</span>;
    }
    switch (evaluation.status) {
      case 'open':
        return <span className="status-badge-compact status-open">Abierto</span>;
      case 'lunch':
        return <span className="status-badge-compact status-lunch">Almuerzo</span>;
      case 'pre_market':
        return <span className="status-badge-compact status-pre">Pre-apertura</span>;
      default:
        return <span className="status-badge-compact status-closed">Cerrado</span>;
    }
  };

  return (
    <div className="timeline-section">
      <div className="timeline-header-bar">
        <h2 className="timeline-title">Línea de Tiempo 24 Horas (Hora de Chile)</h2>
        <div className="timeline-header-actions">
          <button
            type="button"
            onClick={toggleColumn}
            className="column-toggle-pill"
            title={isColumnCollapsed ? 'Expandir nombres y detalles de mercados' : 'Colapsar a solo banderas para más espacio'}
          >
            {isColumnCollapsed ? <PanelLeftOpen size={13} /> : <PanelLeftClose size={13} />}
            <span>{isColumnCollapsed ? 'Ver mercados' : 'Colapsar mercados'}</span>
          </button>
          <span className="timeline-hint">
            Pasa el cursor o desliza sobre la cuadrícula para sincronizar horarios
          </span>
        </div>
      </div>

      <div className="timeline-table-wrapper">
        {/* Left Frozen Column: Market Identity & Scrubber readout */}
        <div className={`timeline-left-column ${isColumnCollapsed ? 'column-collapsed' : ''}`}>
          <div className="timeline-col-header">
            {!isColumnCollapsed && <span>Mercado</span>}
            <button
              type="button"
              onClick={toggleColumn}
              className="collapse-toggle-icon-btn"
              title={isColumnCollapsed ? 'Expandir columna de mercados' : 'Colapsar a solo banderas'}
              aria-label={isColumnCollapsed ? 'Expandir columna' : 'Colapsar columna'}
            >
              {isColumnCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
            </button>
          </div>

          {allMarkets.map((market) => {
            const isChile = market.id === 'chile';
            const ev = isChile ? chileScrubberEvaluation : (scrubberEvaluations[market.id] ?? {
              marketId: market.id,
              status: 'closed',
              localTimeFormatted: '--:--',
              localDateFormatted: ''
            });

            return (
              <div
                key={market.id}
                className={`market-info-cell ${isChile ? 'cell-anchor' : ''} ${isColumnCollapsed ? 'cell-collapsed' : ''}`}
                title={isColumnCollapsed ? `${market.name} (${market.code}) - ${ev.localTimeFormatted}` : undefined}
              >
                <div className="cell-identity">
                  <span className="cell-flag">{market.flag}</span>
                  {!isColumnCollapsed && (
                    <div className="cell-names">
                      <span className="cell-name">{market.name}</span>
                      <span className="cell-code">{market.code}</span>
                    </div>
                  )}
                </div>

                {!isColumnCollapsed && (
                  <div className="cell-scrubber-peek">
                    <span className="cell-scrubber-time">{ev.localTimeFormatted}</span>
                    {getStatusBadge(market.id, ev)}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right Scrollable/Interactive Column: 24h Bars Grid */}
        <div
          className="timeline-bars-container"
          ref={containerRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          onPointerLeave={onPointerLeave}
        >
          {/* Hour Labels at Top */}
          <div className="timeline-col-header-bars">
            {hours.map((h) => {
              const transform =
                h === 0
                  ? 'translate(4px, -50%)'
                  : h === 24
                  ? 'translate(calc(-100% - 4px), -50%)'
                  : 'translate(-50%, -50%)';

              return (
                <div
                  key={h}
                  className="hour-tick-label"
                  style={{ left: `${(h / 24) * 100}%`, transform }}
                >
                  {h.toString().padStart(2, '0')}:00
                </div>
              );
            })}
          </div>

          {/* Background Vertical Grid Lines */}
          <div className="bars-grid-overlay">
            {hours.map((h) => (
              <div
                key={h}
                className={`grid-line ${h % 6 === 0 ? 'grid-line-major' : ''}`}
                style={{ left: `${(h / 24) * 100}%` }}
              />
            ))}
          </div>

          {/* Market Bar Rows */}
          <div className="bars-rows-stack">
            {allMarkets.map((market) => {
              const isChile = market.id === 'chile';
              const segments = isChile ? [] : (marketSegments[market.id] ?? []);

              return (
                <div
                  key={market.id}
                  className={`bar-row-track ${isChile ? 'bar-row-anchor' : ''}`}
                >
                  <div className="bar-track-bg">
                    {/* If Chile anchor, show continuous subtle reference track */}
                    {isChile && (
                      <div className="chile-reference-bar">
                        <span className="chile-ref-text">Eje 24h Santiago de Chile</span>
                      </div>
                    )}

                    {/* Render Segments - Pure clean color blocks without inner text */}
                    {segments.map((seg, idx) => {
                      const leftPercent = (seg.startMinute / 1440) * 100;
                      const widthPercent = ((seg.endMinute - seg.startMinute) / 1440) * 100;
                      const isActive = scrubberMinutes >= seg.startMinute && scrubberMinutes < seg.endMinute;

                      return (
                        <div
                          key={idx}
                          className={`session-block session-${seg.type} ${isActive ? 'session-scrubber-active' : ''}`}
                          style={{
                            left: `${leftPercent}%`,
                            width: `${widthPercent}%`
                          }}
                          title={`${market.name} - ${seg.label ?? seg.type}: ${(seg.startMinute / 60).toFixed(1)}h - ${(seg.endMinute / 60).toFixed(1)}h (Chile)`}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Persistent "Now" Line */}
          <div
            className="now-indicator-line"
            style={{ left: `${nowPercent}%` }}
          >
            <div
              className="now-indicator-badge"
              style={{
                transform:
                  nowPercent < 4
                    ? 'translate(6px, 0)'
                    : nowPercent > 96
                    ? 'translate(calc(-100% - 6px), 0)'
                    : 'translateX(-50%)'
              }}
            >
              <span className="now-pulse" />
              <span>
                {isHovering && Math.abs(scrubberMinutes - currentMinutes) > 2
                  ? 'AHORA'
                  : `AHORA 🇨🇱 ${formatMinutes(currentMinutes)}`}
              </span>
            </div>

            {/* When left column is collapsed and idle, show current country times on Now line */}
            {isColumnCollapsed && !(isHovering && Math.abs(scrubberMinutes - currentMinutes) > 2) && (
              <div className="scrubber-row-times-overlay">
                {allMarkets.map((market, idx) => {
                  const isChile = market.id === 'chile';
                  const ev = isChile
                    ? chileScrubberEvaluation
                    : (scrubberEvaluations[market.id] ?? {
                        marketId: market.id,
                        status: 'closed',
                        localTimeFormatted: '--:--',
                        localDateFormatted: ''
                      });

                  const topPx = 40 + idx * 54 + 27;
                  const edgeTransform =
                    nowPercent < 4
                      ? 'translate(6px, -50%)'
                      : nowPercent > 96
                      ? 'translate(calc(-100% - 6px), -50%)'
                      : 'translate(-50%, -50%)';

                  const statusClass = isChile ? 'status-reference' : `status-${ev.status}`;

                  return (
                    <div
                      key={market.id}
                      className={`scrubber-row-pill ${statusClass}`}
                      style={{
                        top: `${topPx}px`,
                        transform: edgeTransform
                      }}
                      title={`${market.name}: ${ev.localTimeFormatted}`}
                    >
                      <span className="scrubber-row-flag">{market.flag}</span>
                      <span className="scrubber-row-time">{ev.localTimeFormatted}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Interactive Scrubber Line (rendered when user actively scrubs to a different time) */}
          {isHovering && Math.abs(scrubberMinutes - currentMinutes) > 2 && (
            <div
              className="scrubber-crosshair-line scrubber-active"
              style={{ left: `${scrubberPercent}%` }}
            >
              <div
                className="scrubber-badge"
                style={{
                  transform:
                    scrubberPercent < 4
                      ? 'translate(6px, 0)'
                      : scrubberPercent > 96
                      ? 'translate(calc(-100% - 6px), 0)'
                      : 'translateX(-50%)'
                }}
              >
                <span className="scrubber-badge-text">
                  🇨🇱 {formatMinutes(scrubberMinutes)}
                </span>
              </div>

              {/* When left column is collapsed and scrubbing, show projected country times on scrubber line */}
              {isColumnCollapsed && (
                <div className="scrubber-row-times-overlay">
                  {allMarkets.map((market, idx) => {
                    const isChile = market.id === 'chile';
                    const ev = isChile
                      ? chileScrubberEvaluation
                      : (scrubberEvaluations[market.id] ?? {
                          marketId: market.id,
                          status: 'closed',
                          localTimeFormatted: '--:--',
                          localDateFormatted: ''
                        });

                    const topPx = 40 + idx * 54 + 27;
                    const edgeTransform =
                      scrubberPercent < 4
                        ? 'translate(6px, -50%)'
                        : scrubberPercent > 96
                        ? 'translate(calc(-100% - 6px), -50%)'
                        : 'translate(-50%, -50%)';

                    const statusClass = isChile ? 'status-reference' : `status-${ev.status}`;

                    return (
                      <div
                        key={market.id}
                        className={`scrubber-row-pill ${statusClass}`}
                        style={{
                          top: `${topPx}px`,
                          transform: edgeTransform
                        }}
                        title={`${market.name}: ${ev.localTimeFormatted}`}
                      >
                        <span className="scrubber-row-flag">{market.flag}</span>
                        <span className="scrubber-row-time">{ev.localTimeFormatted}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="timeline-legend">
        <div className="legend-item">
          <span className="legend-box legend-open" />
          <span>Mercado Abierto</span>
        </div>
        <div className="legend-item">
          <span className="legend-box legend-lunch" />
          <span>Almuerzo / Pre-apertura</span>
        </div>
        <div className="legend-item">
          <span className="legend-box legend-closed" />
          <span>Cerrado</span>
        </div>
        <div className="legend-item">
          <span className="legend-line legend-now" />
          <span>Hora actual (Chile)</span>
        </div>
        <div className="legend-item">
          <span className="legend-line legend-cursor" />
          <span>Cursor interactivo</span>
        </div>
      </div>
    </div>
  );
};
