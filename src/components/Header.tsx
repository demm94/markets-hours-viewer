import React from 'react';
import { motion } from 'framer-motion';
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

export const Header: React.FC<HeaderProps> = React.memo(({
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
        <img src="/favicon.svg" alt="Markets View Logo" className="header-logo" width="24" height="24" />
        <h1 className="header-app-name">Markets View</h1>
        <motion.div
          key={openMarketsCount}
          initial={{ scale: 0.92 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className="header-open-badge"
        >
          <Activity size={12} className="animate-pulse text-emerald-400" />
          <span>
            <strong>{openMarketsCount}</strong>/{totalMarketsCount} abiertos
          </span>
        </motion.div>
      </div>

      <div className="header-clock-strip">
        <div className="header-clock-location">
          <motion.span
            className="live-dot"
            animate={{ scale: [1, 1.25, 1], opacity: [1, 0.65, 1] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <span className="location-name">Santiago</span>
        </div>

        <span className="header-clock-time">{timeFormatted}</span>
        <span className="header-offset-chip">{santiagoOffset}</span>
        <span className="header-clock-date">{dateFormatted}</span>
      </div>
    </header>
  );
});

Header.displayName = 'Header';
