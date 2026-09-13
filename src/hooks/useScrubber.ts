import { useState, useCallback, useRef } from 'react';

export interface UseScrubberResult {
  scrubberMinutes: number;
  isHovering: boolean;
  isDragging: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
  handlePointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  handlePointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
  handlePointerUp: (e: React.PointerEvent<HTMLDivElement>) => void;
  handlePointerLeave: () => void;
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
      const minutes = calculateMinutesFromEvent(e.clientX);
      if (minutes !== null) {
        setScrubberMinutes(minutes);
        setIsDragging(true);
        setIsHovering(true);
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
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
        (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
      } catch {
        // Ignore if pointer capture wasn't active
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

  return {
    scrubberMinutes: scrubberMinutes ?? defaultMinutes,
    isHovering,
    isDragging,
    containerRef,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerLeave,
    resetToNow,
    setScrubberMinutes
  };
}
