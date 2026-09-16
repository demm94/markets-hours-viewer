import { useState, useEffect, useRef } from 'react';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void> | void;
  threshold?: number;
  maxPull?: number;
}

export function usePullToRefresh({
  onRefresh,
  threshold = 60,
  maxPull = 85
}: UsePullToRefreshOptions) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const pullDistanceRef = useRef(0);
  const startYRef = useRef(0);
  const isPullingRef = useRef(false);
  const isRefreshingRef = useRef(false);
  const onRefreshRef = useRef(onRefresh);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    isRefreshingRef.current = isRefreshing;
  }, [isRefreshing]);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      // Only initiate pull-to-refresh if window is at the very top
      if (window.scrollY > 5) return;
      if (isRefreshingRef.current) return;

      // Do not intercept touches starting inside horizontal timeline scrubber or slider
      const target = e.target as HTMLElement | null;
      if (
        target?.closest('.timeline-bars-container') ||
        target?.closest('.timeline-table-wrapper') ||
        target?.closest('.timeline-slider-bar')
      ) {
        return;
      }

      if (e.touches.length === 1) {
        startYRef.current = e.touches[0].clientY;
        isPullingRef.current = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPullingRef.current || isRefreshingRef.current) return;

      const currentY = e.touches[0].clientY;
      const rawDelta = currentY - startYRef.current;

      if (rawDelta > 0 && window.scrollY <= 0) {
        // Natural resistance formula mimicking native iOS/Android spring physics
        const dampened = Math.min(Math.pow(rawDelta, 0.82) * 0.9, maxPull);
        pullDistanceRef.current = dampened;
        setPullDistance(dampened);

        // Prevent native bounce while custom pull is active
        if (rawDelta > 15 && e.cancelable) {
          e.preventDefault();
        }
      } else {
        pullDistanceRef.current = 0;
        setPullDistance(0);
      }
    };

    const handleTouchEnd = async () => {
      if (!isPullingRef.current) return;
      isPullingRef.current = false;

      const distance = pullDistanceRef.current;
      if (distance >= threshold && !isRefreshingRef.current) {
        setIsRefreshing(true);
        pullDistanceRef.current = threshold;
        setPullDistance(threshold);

        try {
          await onRefreshRef.current();
        } finally {
          setTimeout(() => {
            setIsRefreshing(false);
            pullDistanceRef.current = 0;
            setPullDistance(0);
          }, 450);
        }
      } else {
        pullDistanceRef.current = 0;
        setPullDistance(0);
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [threshold, maxPull]);

  return {
    pullDistance,
    isRefreshing,
    isTriggered: pullDistance >= threshold
  };
}
