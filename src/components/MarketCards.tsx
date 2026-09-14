import React from 'react';
import { motion, type Variants } from 'framer-motion';
import { MarketConfig, MarketEvaluation } from '../core/types';

interface MarketCardsProps {
  markets: MarketConfig[];
  evaluations: Record<string, MarketEvaluation>;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 12, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 350,
      damping: 25
    }
  }
};

export const MarketCards: React.FC<MarketCardsProps> = React.memo(({ markets, evaluations }) => {
  return (
    <motion.div
      className="market-cards-grid"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
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
          <motion.div 
            key={market.id}
            variants={cardVariants}
            whileHover={{ scale: 1.02, transition: { duration: 0.15 } }}
            whileTap={{ scale: 0.98 }}
            layout
            className={`market-card ${statusClass}`}
            title={`${market.name} (${market.code}) - ${statusText} - ${ev?.localTimeFormatted ?? '--:--'}`}
          >
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
                <span className="status-text">{statusText}</span>
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
          </motion.div>
        );
      })}
    </motion.div>
  );
});

MarketCards.displayName = 'MarketCards';
