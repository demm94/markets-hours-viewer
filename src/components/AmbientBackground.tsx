import React from 'react';

interface AmbientBackgroundProps {
  openMarketsCount?: number;
}

/**
 * Minimalist, GPU-composited animated backdrop for the financial dashboard.
 * Layers a rich midnight-slate atmospheric gradient, slow drifting ambient washes,
 * a status-reactive accent glow, a soft radial-masked dot matrix, and a breathing top horizon sheen.
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
      {/* 1. Rich midnight atmospheric base (prevents flat black bottom half) */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 95% 75% at 50% 0%, rgba(17, 25, 45, 0.92) 0%, rgba(9, 13, 24, 0.96) 52%, #05060a 100%)'
        }}
      />

      {/* 2. Slow drifting primary sky-cyan wash */}
      <div
        className="ambient-wash-a absolute -top-[14%] left-[4%] w-[22rem] h-[22rem] sm:w-[34rem] sm:h-[34rem] lg:w-[44rem] lg:h-[44rem] rounded-full blur-[72px] sm:blur-[96px] transform-gpu"
        style={{
          background:
            'radial-gradient(circle, rgba(56, 189, 248, 0.16) 0%, rgba(14, 165, 233, 0.05) 48%, transparent 72%)'
        }}
      />

      {/* 3. Status-reactive counter-drifting wash (emerald when active, indigo when closed) */}
      <div
        className="ambient-wash-b absolute top-[14%] -right-[6%] w-[20rem] h-[20rem] sm:w-[32rem] sm:h-[32rem] lg:w-[42rem] lg:h-[42rem] rounded-full blur-[72px] sm:blur-[96px] transition-colors duration-1000 transform-gpu"
        style={{
          background: hasActiveMarkets
            ? 'radial-gradient(circle, rgba(16, 185, 129, 0.16) 0%, rgba(45, 212, 191, 0.05) 48%, transparent 72%)'
            : 'radial-gradient(circle, rgba(99, 102, 241, 0.16) 0%, rgba(139, 92, 246, 0.05) 48%, transparent 72%)'
        }}
      />

      {/* 4. Lower atmospheric counterbalance glow */}
      <div
        className="ambient-wash-c absolute -bottom-[16%] left-[18%] w-[24rem] h-[24rem] sm:w-[36rem] sm:h-[36rem] lg:w-[46rem] lg:h-[46rem] rounded-full blur-[80px] sm:blur-[110px] transform-gpu"
        style={{
          background:
            'radial-gradient(circle, rgba(56, 189, 248, 0.10) 0%, rgba(139, 92, 246, 0.08) 45%, transparent 72%)'
        }}
      />

      {/* 5. Whisper-soft radial-masked dot matrix + breathing top horizon sheen */}
      <div className="absolute inset-0 ambient-dot-mask" />

      <div
        className="ambient-horizon-sheen absolute -top-12 left-1/2 -translate-x-1/2 w-[78vw] max-w-[1100px] h-[96px] rounded-full blur-[28px] transform-gpu"
        style={{
          background: hasActiveMarkets
            ? 'radial-gradient(ellipse 65% 60% at 50% 45%, rgba(16, 185, 129, 0.22), rgba(56, 189, 248, 0.14) 55%, transparent 80%)'
            : 'radial-gradient(ellipse 65% 60% at 50% 45%, rgba(56, 189, 248, 0.22), rgba(99, 102, 241, 0.12) 55%, transparent 80%)'
        }}
      />

      <div
        className="ambient-horizon-sheen absolute top-0 inset-x-0 h-[1px]"
        style={{
          background: hasActiveMarkets
            ? 'linear-gradient(90deg, transparent 8%, rgba(56, 189, 248, 0.45) 35%, rgba(16, 185, 129, 0.45) 65%, transparent 92%)'
            : 'linear-gradient(90deg, transparent 8%, rgba(56, 189, 248, 0.45) 35%, rgba(99, 102, 241, 0.42) 65%, transparent 92%)'
        }}
      />
    </div>
  );
});

AmbientBackground.displayName = 'AmbientBackground';
