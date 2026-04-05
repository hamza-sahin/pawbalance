import { useRef, useState, useCallback, useEffect, type RefObject } from "react";

interface UseSheetDragOptions {
  onDismiss: () => void;
  /** Pixels the sheet must be dragged down before it dismisses (default 120) */
  dismissThreshold?: number;
  /** Pixels the sheet must be dragged up before it maximizes (default 60) */
  maximizeThreshold?: number;
  /** Whether drag and dismiss are disabled (e.g. during loading) */
  disabled?: boolean;
}

/**
 * Adds native-feeling drag-to-dismiss/maximize to a bottom sheet,
 * plus Escape key, body scroll lock, and focus trap.
 *
 * Attach `sheetRef` to the sheet panel, spread `handlers` onto it,
 * and apply `maximized` for full-height styling.
 */
export function useSheetDrag({
  onDismiss,
  dismissThreshold = 120,
  maximizeThreshold = 60,
  disabled = false,
}: UseSheetDragOptions): {
  sheetRef: RefObject<HTMLDivElement | null>;
  maximized: boolean;
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: () => void;
  };
} {
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const dragging = useRef(false);
  const [maximized, setMaximized] = useState(false);

  // ── Escape key ──
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !disabled) onDismiss();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onDismiss, disabled]);

  // ── Body scroll lock ──
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  // ── Focus trap ──
  useEffect(() => {
    function handleTab(e: KeyboardEvent) {
      if (e.key !== "Tab" || !sheetRef.current) return;
      const focusable = sheetRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", handleTab);
    return () => document.removeEventListener("keydown", handleTab);
  }, []);

  // ── Drag logic ──

  const isScrolledToTop = useCallback((target: EventTarget) => {
    let el = target as HTMLElement | null;
    while (el && el !== sheetRef.current) {
      if (el.scrollTop > 0) return false;
      el = el.parentElement;
    }
    return true;
  }, []);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled) return;
      if (!isScrolledToTop(e.target)) return;
      startY.current = e.touches[0].clientY;
      currentY.current = 0;
      dragging.current = true;
      if (sheetRef.current) {
        sheetRef.current.style.transition = "none";
      }
    },
    [disabled, isScrolledToTop],
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!dragging.current) return;
      const delta = e.touches[0].clientY - startY.current;
      currentY.current = delta;

      if (sheetRef.current) {
        if (delta >= 0) {
          sheetRef.current.style.transform = `translateY(${delta}px)`;
        } else {
          const dampened = -Math.sqrt(Math.abs(delta)) * 3;
          sheetRef.current.style.transform = `translateY(${dampened}px)`;
        }
      }
    },
    [],
  );

  const onTouchEnd = useCallback(() => {
    if (!dragging.current) return;
    dragging.current = false;
    const sheet = sheetRef.current;
    if (!sheet) return;

    const delta = currentY.current;

    if (delta >= dismissThreshold) {
      if (maximized) {
        sheet.style.transition = "transform 250ms ease-out";
        sheet.style.transform = "translateY(0)";
        setMaximized(false);
      } else {
        sheet.style.transition = "transform 200ms ease-out";
        sheet.style.transform = "translateY(100%)";
        setTimeout(onDismiss, 200);
      }
    } else if (delta <= -maximizeThreshold && !maximized) {
      sheet.style.transition = "transform 250ms ease-out";
      sheet.style.transform = "translateY(0)";
      setMaximized(true);
    } else {
      sheet.style.transition = "transform 250ms ease-out";
      sheet.style.transform = "translateY(0)";
    }
  }, [onDismiss, dismissThreshold, maximizeThreshold, maximized]);

  return {
    sheetRef,
    maximized,
    handlers: { onTouchStart, onTouchMove, onTouchEnd },
  };
}
