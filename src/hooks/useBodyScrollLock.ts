import { useEffect } from 'react';

let activeLockCount = 0;
let previousOverflow = '';

/**
 * Acquires a reference-counted scroll lock on `document.body`.
 * Returns an idempotent release function that restores the original overflow value
 * once all active overlays have released their locks.
 */
export function acquireBodyScrollLock(): () => void {
  if (typeof document === 'undefined') {
    return () => {};
  }

  if (activeLockCount === 0) {
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  activeLockCount += 1;

  let released = false;
  return () => {
    if (released) return;
    released = true;

    if (activeLockCount > 0) {
      activeLockCount -= 1;
    }

    if (activeLockCount === 0 && typeof document !== 'undefined') {
      document.body.style.overflow = previousOverflow;
      previousOverflow = '';
    }
  };
}

/**
 * Resets module-level scroll lock state for isolated unit tests.
 */
export function resetBodyScrollLockForTest(): void {
  activeLockCount = 0;
  previousOverflow = '';
}

/**
 * Locks document body scrolling while `isLocked` is true and releases deterministically on close or unmount.
 */
export function useBodyScrollLock(isLocked: boolean): void {
  useEffect(() => {
    if (!isLocked) return;
    return acquireBodyScrollLock();
  }, [isLocked]);
}
