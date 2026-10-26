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
  handlePointerLeave: (e?: React.PointerEvent<HTMLDivElement>) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  resetToNow: () => void;
  setScrubberMinutes: (minutes: number | null) => void;
}

/**
 * Pure helper that converts a pointer X coordinate and container bounding rect into clamped [0, 1440] minutes.
 */
export function calculateScrubberMinutesFromBounds(
  clientX: number,
  rectLeft: number,
  rectWidth: number
): number | null {
  if (rectWidth <= 0) return null;
  const relativeX = clientX - rectLeft;
  const clampedRatio = Math.max(0, Math.min(1, relativeX / rectWidth));
  return Math.round(clampedRatio * 1440);
}

export interface ScrubberKeyResolution {
  handled: boolean;
  nextMinutes: number | null;
  isHovering: boolean;
  isDragging?: boolean;
}

/**
 * Pure helper that resolves keyboard navigation keys on the timeline scrubber into state transitions.
 */
export function resolveScrubberKeyAction(
  key: string,
  currentMinutes: number | null,
  defaultMinutes: number
): ScrubberKeyResolution {
  if (key === 'Home') {
    return { handled: true, nextMinutes: 0, isHovering: true };
  }
  if (key === 'End') {
    return { handled: true, nextMinutes: 1440, isHovering: true };
  }
  if (key === 'Escape') {
    return { handled: true, nextMinutes: null, isHovering: false, isDragging: false };
  }

  let step = 0;
  if (key === 'ArrowLeft') step = -15;
  else if (key === 'ArrowRight') step = 15;
  else if (key === 'PageDown') step = -60;
  else if (key === 'PageUp') step = 60;

  if (step !== 0) {
    const base = currentMinutes ?? defaultMinutes;
    const clamped = Math.max(0, Math.min(1440, base + step));
    return { handled: true, nextMinutes: clamped, isHovering: true };
  }

  return { handled: false, nextMinutes: currentMinutes, isHovering: false };
}

export function useScrubber(defaultMinutes: number): UseScrubberResult {
  const [scrubberMinutes, setScrubberMinutes] = useState<number | null>(null);
  const [isHovering, setIsHovering] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const calculateMinutesFromEvent = useCallback((clientX: number): number | null => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    return calculateScrubberMinutesFromBounds(clientX, rect.left, rect.width);
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
      setScrubberMinutes(null);
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

  const handlePointerLeave = useCallback(
    (e?: React.PointerEvent<HTMLDivElement>) => {
      // On touch/pen devices, keep the scrubbed position persistent after lifting the finger
      if (e && e.pointerType !== 'mouse') {
        return;
      }
      if (!isDragging) {
        setIsHovering(false);
        setScrubberMinutes(null);
      }
    },
    [isDragging]
  );

  const resetToNow = useCallback(() => {
    setScrubberMinutes(null);
    setIsHovering(false);
    setIsDragging(false);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        resetToNow();
        return;
      }

      setScrubberMinutes((prev) => {
        const res = resolveScrubberKeyAction(e.key, prev, defaultMinutes);
        if (!res.handled) return prev;
        e.preventDefault();
        setIsHovering(res.isHovering);
        return res.nextMinutes;
      });
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
