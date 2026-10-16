import React from 'react';

interface AmbientBackgroundProps {
  openMarketsCount?: number;
}

/**
 * Living architectural background for the financial terminal.
 * Combines slow-drifting volumetric aurora orbs, a radial-masked coordinate grid,
 * animated telemetry light beams along grid axes, and a reactive market-status pulse.
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
      {/* 1. Deep atmospheric base gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% -10%, rgba(14, 21, 38, 0.95) 0%, rgba(7, 9, 16, 0.98) 55%, #05060a 100%)'
        }}
      />

      {/* 2. Top horizon atmospheric crest */}
      <div
        className="absolute -top-32 left-1/2 -translate-x-1/2 w-[120vw] max-w-[1600px] h-[340px] rounded-full opacity-90"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 35%, rgba(56, 189, 248, 0.20), rgba(16, 185, 129, 0.08) 45%, transparent 80%)',
          filter: 'blur(40px)'
        }}
      />

      {/* 3. Living Volumetric Aurora Orbs (GPU compositor animated) */}
      <div
        className="ambient-orb-1 absolute -top-[12%] left-[8%] w-[38rem] h-[38rem] rounded-full opacity-80"
        style={{
          background:
            'radial-gradient(circle, rgba(56, 189, 248, 0.22) 0%, rgba(34, 211, 238, 0.08) 45%, transparent 72%)',
          filter: 'blur(80px)'
        }}
      />

      <div
        className="ambient-orb-2 absolute top-[18%] right-[4%] w-[36rem] h-[36rem] rounded-full transition-colors duration-1000 opacity-85"
        style={{
          background: hasActiveMarkets
            ? 'radial-gradient(circle, rgba(16, 185, 129, 0.20) 0%, rgba(56, 189, 248, 0.08) 48%, transparent 72%)'
            : 'radial-gradient(circle, rgba(99, 102, 241, 0.20) 0%, rgba(56, 189, 248, 0.07) 48%, transparent 72%)',
          filter: 'blur(85px)'
        }}
      />

      <div
        className="ambient-orb-3 absolute -bottom-[15%] left-[22%] w-[42rem] h-[42rem] rounded-full opacity-75"
        style={{
          background:
            'radial-gradient(circle, rgba(139, 92, 246, 0.16) 0%, rgba(56, 189, 248, 0.06) 50%, transparent 72%)',
          filter: 'blur(90px)'
        }}
      />

      {/* 4. Architectural Coordinate Grid + Sub-grid with Radial Vignette Mask */}
      <div className="absolute inset-0 ambient-grid-mask">
        {/* Primary 48px hairline grid */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255, 255, 255, 0.045) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 255, 255, 0.045) 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px'
          }}
        />

        {/* Secondary 240px macro-sector grid */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(56, 189, 248, 0.07) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(56, 189, 248, 0.07) 1px, transparent 1px)
            `,
            backgroundSize: '240px 240px'
          }}
        />

        {/* 5. Animated Telemetry Light Beams ("Order Flow Pulses") along grid lines */}
        <div
          className="ambient-beam-x-1 absolute top-[192px] left-0 h-[1px] w-72"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(56, 189, 248, 0.65) 50%, rgba(255, 255, 255, 0.9) 85%, transparent 100%)',
            boxShadow: '0 0 12px rgba(56, 189, 248, 0.45)'
          }}
        />

        <div
          className="ambient-beam-x-2 absolute top-[432px] left-0 h-[1px] w-96"
          style={{
            background: hasActiveMarkets
              ? 'linear-gradient(90deg, transparent 0%, rgba(16, 185, 129, 0.65) 50%, rgba(110, 231, 183, 0.9) 85%, transparent 100%)'
              : 'linear-gradient(90deg, transparent 0%, rgba(168, 85, 247, 0.6) 50%, rgba(216, 180, 254, 0.85) 85%, transparent 100%)',
            boxShadow: hasActiveMarkets
              ? '0 0 12px rgba(16, 185, 129, 0.45)'
              : '0 0 12px rgba(168, 85, 247, 0.4)'
          }}
        />

        <div
          className="ambient-beam-y-1 absolute top-0 left-[240px] w-[1px] h-64"
          style={{
            background:
              'linear-gradient(180deg, transparent 0%, rgba(56, 189, 248, 0.55) 60%, rgba(255, 255, 255, 0.85) 90%, transparent 100%)',
            boxShadow: '0 0 10px rgba(56, 189, 248, 0.4)'
          }}
        />

        <div
          className="ambient-beam-y-2 absolute top-0 right-[288px] w-[1px] h-72 hidden md:block"
          style={{
            background:
              'linear-gradient(180deg, transparent 0%, rgba(16, 185, 129, 0.5) 60%, rgba(167, 243, 208, 0.85) 90%, transparent 100%)',
            boxShadow: '0 0 10px rgba(16, 185, 129, 0.35)'
          }}
        />
      </div>

      {/* 6. Top Specular Horizon Line */}
      <div
        className="absolute top-0 inset-x-0 h-[1px]"
        style={{
          background:
            'linear-gradient(90deg, transparent 5%, rgba(56, 189, 248, 0.45) 35%, rgba(16, 185, 129, 0.45) 65%, transparent 95%)'
        }}
      />
    </div>
  );
});

AmbientBackground.displayName = 'AmbientBackground';
