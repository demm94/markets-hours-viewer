import { useEffect, useRef } from 'react';

interface UseFocusTrapOptions {
  isOpen: boolean;
  onClose?: () => void;
  autoFocus?: boolean;
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  returnFocus?: boolean;
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'button:not([disabled])',
  'iframe',
  'object',
  'embed',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable]'
].join(', ');

function isVisible(el: HTMLElement): boolean {
  return (
    el.offsetWidth > 0 ||
    el.offsetHeight > 0 ||
    el.getClientRects().length > 0 ||
    el.tabIndex >= 0
  );
}

/**
 * WAI-ARIA compliant focus trap hook for modal dialogs and drawers.
 * Manages initial focus, traps Tab/Shift+Tab, handles Escape key, and restores focus on close.
 */
export function useFocusTrap<T extends HTMLElement = HTMLDivElement>({
  isOpen,
  onClose,
  autoFocus = true,
  initialFocusRef,
  returnFocus = true
}: UseFocusTrapOptions) {
  const containerRef = useRef<T | null>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const wasOpenRef = useRef(false);

  // Focus restoration lifecycle
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement | null;
      wasOpenRef.current = true;
    } else if (wasOpenRef.current) {
      wasOpenRef.current = false;
      if (
        returnFocus &&
        previousActiveElement.current &&
        typeof previousActiveElement.current.focus === 'function' &&
        document.body.contains(previousActiveElement.current)
      ) {
        const target = previousActiveElement.current;
        requestAnimationFrame(() => {
          target.focus();
        });
      }
    }
  }, [isOpen, returnFocus]);

  // Unmount cleanup if unmounted while still open
  useEffect(() => {
    return () => {
      if (
        wasOpenRef.current &&
        returnFocus &&
        previousActiveElement.current &&
        typeof previousActiveElement.current.focus === 'function' &&
        document.body.contains(previousActiveElement.current)
      ) {
        const target = previousActiveElement.current;
        requestAnimationFrame(() => {
          target.focus();
        });
      }
    };
  }, [returnFocus]);

  // Initial focus
  useEffect(() => {
    if (!isOpen || !autoFocus) return;

    const frameId = requestAnimationFrame(() => {
      if (initialFocusRef?.current) {
        initialFocusRef.current.focus();
        return;
      }

      const container = containerRef.current;
      if (!container) return;

      const focusable = Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      ).filter(isVisible);

      if (focusable.length > 0) {
        focusable[0].focus();
      } else {
        container.tabIndex = -1;
        container.focus();
      }
    });

    return () => cancelAnimationFrame(frameId);
  }, [isOpen, autoFocus, initialFocusRef]);

  // Trap focus (Tab / Shift+Tab) & Escape listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (onClose) {
          e.preventDefault();
          onClose();
        }
        return;
      }

      if (e.key === 'Tab') {
        const container = containerRef.current;
        if (!container) return;

        const focusable = Array.from(
          container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
        ).filter(isVisible);

        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }

        const firstElement = focusable[0];
        const lastElement = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (
            document.activeElement === firstElement ||
            !container.contains(document.activeElement)
          ) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (
            document.activeElement === lastElement ||
            !container.contains(document.activeElement)
          ) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  return containerRef;
}
