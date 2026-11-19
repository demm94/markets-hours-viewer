import { useState, useCallback, useRef } from 'react';

export interface UseScrubberResult {
  scrubberMinutes: number;
  isHovering: boolean;
  isDragging: boolean;
  isPinned: boolean;
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

/**
 * Determines whether leaving the timeline bounds should clear the active scrubber position.
 * Touch/pen pointers, active drags, and pinned positions remain sticky so users can read times
 * and reach the "Volver a Ahora" button cleanly on desktop and mobile.
 */
export function shouldClearScrubberOnLeave(
  pointerType: string | undefined,
  isDragging: boolean,
  isPinned: boolean
): boolean {
  if (pointerType && pointerType !== 'mouse') {
    return false;
  }
  if (isDragging || isPinned) {
    return false;
  }
  return true;
}

export interface ScrubberCancelResolution {
  isPinned: boolean;
  scrubberMinutes: number | null;
  isHovering: boolean;
}

/**
 * Pure helper that restores the pre-gesture pin state on pointercancel so vertical
 * touch scrolling over the timeline does not accidentally pin the scrubber.
 */
export function resolveScrubberCancelState(
  prevPinned: boolean,
  prevMinutes: number | null
): ScrubberCancelResolution {
  return {
    isPinned: prevPinned,
    scrubberMinutes: prevPinned ? prevMinutes : null,
    isHovering: prevPinned
  };
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
  if (key === 'ArrowLeft' || key === 'ArrowDown') step = -15;
  else if (key === 'ArrowRight' || key === 'ArrowUp') step = 15;
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
  const [scrubberMinutes, setScrubberMinutesState] = useState<number | null>(null);
  const [isHovering, setIsHovering] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isPinned, setIsPinned] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const scrubberMinutesRef = useRef<number | null>(null);
  const isPinnedRef = useRef<boolean>(false);
  const isDraggingRef = useRef<boolean>(false);
  const pointerStartRef = useRef<{
    x: number;
    prevPinned: boolean;
    prevMinutes: number | null;
  } | null>(null);

  const setScrubberMinutes = useCallback((minutes: number | null) => {
    scrubberMinutesRef.current = minutes;
    setScrubberMinutesState(minutes);
  }, []);

  const updatePinned = useCallback((pinned: boolean) => {
    isPinnedRef.current = pinned;
    setIsPinned(pinned);
  }, []);

  const updateDragging = useCallback((dragging: boolean) => {
    isDraggingRef.current = dragging;
    setIsDragging(dragging);
  }, []);

  const calculateMinutesFromEvent = useCallback((clientX: number): number | null => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    return calculateScrubberMinutesFromBounds(clientX, rect.left, rect.width);
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const minutes = calculateMinutesFromEvent(e.clientX);
      if (minutes !== null) {
        pointerStartRef.current = {
          x: e.clientX,
          prevPinned: isPinnedRef.current,
          prevMinutes: scrubberMinutesRef.current
        };
        setScrubberMinutes(minutes);
        updateDragging(true);
        setIsHovering(true);
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          // Fallback if setPointerCapture is unsupported
        }
      }
    },
    [calculateMinutesFromEvent, setScrubberMinutes, updateDragging]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // Preserve pinned cursor when hovering without holding pointer down
      if (isPinnedRef.current && !isDraggingRef.current) {
        return;
      }
      if (
        isDraggingRef.current &&
        pointerStartRef.current &&
        Math.abs(e.clientX - pointerStartRef.current.x) > 6
      ) {
        updatePinned(true);
      }
      const minutes = calculateMinutesFromEvent(e.clientX);
      if (minutes !== null) {
        setScrubberMinutes(minutes);
        setIsHovering(true);
      }
    },
    [calculateMinutesFromEvent, setScrubberMinutes, updatePinned]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (isDraggingRef.current) {
        updatePinned(true);
        updateDragging(false);
        pointerStartRef.current = null;
      }
      try {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      } catch {
        // Safe fallback
      }
    },
    [updateDragging, updatePinned]
  );

  const handlePointerCancel = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const start = pointerStartRef.current;
      const restored = resolveScrubberCancelState(
        start?.prevPinned ?? false,
        start?.prevMinutes ?? null
      );
      pointerStartRef.current = null;
      updateDragging(false);
      updatePinned(restored.isPinned);
      setScrubberMinutes(restored.scrubberMinutes);
      setIsHovering(restored.isHovering);
      try {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      } catch {
        // Safe fallback
      }
    },
    [setScrubberMinutes, updateDragging, updatePinned]
  );

  const handlePointerLeave = useCallback(
    (e?: React.PointerEvent<HTMLDivElement>) => {
      if (shouldClearScrubberOnLeave(e?.pointerType, isDraggingRef.current, isPinnedRef.current)) {
        setIsHovering(false);
        setScrubberMinutes(null);
      }
    },
    [setScrubberMinutes]
  );

  const resetToNow = useCallback(() => {
    pointerStartRef.current = null;
    setScrubberMinutes(null);
    setIsHovering(false);
    updateDragging(false);
    updatePinned(false);
  }, [setScrubberMinutes, updateDragging, updatePinned]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const res = resolveScrubberKeyAction(e.key, scrubberMinutesRef.current, defaultMinutes);
      if (!res.handled) return;

      e.preventDefault();
      if (res.nextMinutes === null) {
        resetToNow();
        return;
      }

      setScrubberMinutes(res.nextMinutes);
      setIsHovering(res.isHovering);
      updatePinned(true);
    },
    [defaultMinutes, resetToNow, setScrubberMinutes, updatePinned]
  );

  return {
    scrubberMinutes: scrubberMinutes ?? defaultMinutes,
    isHovering,
    isDragging,
    isPinned,
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
