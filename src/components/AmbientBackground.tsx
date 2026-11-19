import React from 'react';

interface AmbientBackgroundProps {
  openMarketsCount?: number;
}

/**
 * Calm, high-contrast ambient backdrop for the market hours dashboard.
 * Provides subtle depth without distracting animated beams or grid noise.
 */
export const AmbientBackground: React.FC<AmbientBackgroundProps> = React.memo(({
  openMarketsCount = 0
}) => {
  const hasActiveMarkets = openMarketsCount > 0;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none"
    >
      {/* Base obsidian depth gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 85% 50% at 50% -10%, rgba(16, 24, 42, 0.85) 0%, rgba(7, 9, 16, 0.96) 55%, #05060a 100%)'
        }}
      />

      {/* Subtle status-reactive top glow */}
      <div
        className="absolute -top-28 left-1/2 -translate-x-1/2 w-[90vw] max-w-[1200px] h-[220px] rounded-full transition-colors duration-700"
        style={{
          background: hasActiveMarkets
            ? 'radial-gradient(ellipse 65% 55% at 50% 35%, rgba(16, 185, 129, 0.08), rgba(56, 189, 248, 0.06) 50%, transparent 80%)'
            : 'radial-gradient(ellipse 65% 55% at 50% 35%, rgba(56, 189, 248, 0.08), transparent 75%)',
          filter: 'blur(36px)'
        }}
      />

      {/* Top specular hairline */}
      <div
        className="absolute top-0 inset-x-0 h-[1px]"
        style={{
          background:
            'linear-gradient(90deg, transparent 10%, rgba(56, 189, 248, 0.30) 40%, rgba(16, 185, 129, 0.25) 65%, transparent 90%)'
        }}
      />
    </div>
  );
});

AmbientBackground.displayName = 'AmbientBackground';
