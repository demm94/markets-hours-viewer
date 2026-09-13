import React from 'react';
import { MarketConfig, MarketEvaluation } from '../core/types';

interface MarketCardsProps {
  markets: MarketConfig[];
  evaluations: Record<string, MarketEvaluation>;
}

export const MarketCards: React.FC<MarketCardsProps> = ({ markets, evaluations }) => {
  return (
    <div className="market-cards-grid">
      {markets.map((market) => {
        const ev = evaluations[market.id];
        const status = ev?.status ?? 'closed';

        let statusText = 'Cerrado';
        let statusClass = 'status-closed';

        if (status === 'open') {
          statusText = 'Abierto';
          statusClass = 'status-open';
        } else if (status === 'lunch') {
          statusText = 'Almuerzo';
          statusClass = 'status-lunch';
        } else if (status === 'pre_market') {
          statusText = 'Pre-apertura';
          statusClass = 'status-pre';
        }

        return (
          <div key={market.id} className={`market-card ${statusClass}`}>
            <div className="market-card-top">
              <div className="market-card-flag-group">
                <span className="market-flag">{market.flag}</span>
                <div>
                  <div className="market-country">{market.name}</div>
                  <div className="market-code">{market.code}</div>
                </div>
              </div>
              <span className={`status-badge ${statusClass}`}>
                <span className="status-dot" />
                {statusText}
              </span>
            </div>

            <div className="market-card-time-row">
              <span className="market-time-label">Hora local:</span>
              <span className="market-time-val">{ev?.localTimeFormatted ?? '--:--'}</span>
            </div>

            <div className="market-card-footer">
              <span className="market-tz">{market.timezone}</span>
              <span className="market-date">{ev?.localDateFormatted}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
