import { useState, useCallback, useRef } from 'react';

export interface UseScrubberResult {
  scrubberMinutes: number;
  isHovering: boolean;
  isDragging: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
  handlePointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  handlePointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
  handlePointerUp: (e: React.PointerEvent<HTMLDivElement>) => void;
  handlePointerCancel: (e: React.PointerEvent<HTMLDivElement>) => void;
  handlePointerLeave: () => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  resetToNow: () => void;
  setScrubberMinutes: (minutes: number | null) => void;
}

export function useScrubber(defaultMinutes: number): UseScrubberResult {
  const [scrubberMinutes, setScrubberMinutes] = useState<number | null>(null);
  const [isHovering, setIsHovering] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const calculateMinutesFromEvent = useCallback((clientX: number): number | null => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width <= 0) return null;

    const relativeX = clientX - rect.left;
    const clampedRatio = Math.max(0, Math.min(1, relativeX / rect.width));
    return Math.round(clampedRatio * 1440);
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // Isolate pointer interaction
      const minutes = calculateMinutesFromEvent(e.clientX);
      if (minutes !== null) {
        setScrubberMinutes(minutes);
        setIsDragging(true);
        setIsHovering(true);
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          // Fallback if setPointerCapture is unsupported
        }
      }
    },
    [calculateMinutesFromEvent]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const minutes = calculateMinutesFromEvent(e.clientX);
      if (minutes !== null) {
        setScrubberMinutes(minutes);
        setIsHovering(true);
      }
    },
    [calculateMinutesFromEvent]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      setIsDragging(false);
      try {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      } catch {
        // Safe fallback
      }
    },
    []
  );

  const handlePointerCancel = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      setIsDragging(false);
      setIsHovering(false);
      try {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      } catch {
        // Safe fallback
      }
    },
    []
  );

  const handlePointerLeave = useCallback(() => {
    if (!isDragging) {
      setIsHovering(false);
      setScrubberMinutes(null);
    }
  }, [isDragging]);

  const resetToNow = useCallback(() => {
    setScrubberMinutes(null);
    setIsHovering(false);
    setIsDragging(false);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      let step = 0;
      if (e.key === 'ArrowLeft') step = -15;
      else if (e.key === 'ArrowRight') step = 15;
      else if (e.key === 'PageDown') step = -60;
      else if (e.key === 'PageUp') step = 60;
      else if (e.key === 'Home') {
        e.preventDefault();
        setScrubberMinutes(0);
        setIsHovering(true);
        return;
      } else if (e.key === 'End') {
        e.preventDefault();
        setScrubberMinutes(1440);
        setIsHovering(true);
        return;
      } else if (e.key === 'Escape') {
        e.preventDefault();
        resetToNow();
        return;
      }

      if (step !== 0) {
        e.preventDefault();
        setIsHovering(true);
        setScrubberMinutes((prev) => {
          const current = prev ?? defaultMinutes;
          return Math.max(0, Math.min(1440, current + step));
        });
      }
    },
    [defaultMinutes, resetToNow]
  );

  return {
    scrubberMinutes: scrubberMinutes ?? defaultMinutes,
    isHovering,
    isDragging,
    containerRef,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    handlePointerLeave,
    handleKeyDown,
    resetToNow,
    setScrubberMinutes
  };
}
