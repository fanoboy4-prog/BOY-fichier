import { useCallback, useRef, useState, useEffect } from 'react';

interface LongPressOptions {
  onLongPress: (e: React.TouchEvent | React.MouseEvent) => void;
  onClick?: () => void;
  delay?: number;
}

/**
 * Returns touch + mouse handlers that detect a long-press (default 500ms).
 * Vibrate on long-press. Also clears the timer on touch move / scroll / touch cancel.
 * Works with right-click (onContextMenu) as a shortcut.
 */
export function useLongPress({ onLongPress, onClick, delay = 500 }: LongPressOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggeredRef = useRef(false);
  const [isPressing, setIsPressing] = useState(false);

  const start = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    triggeredRef.current = false;
    setIsPressing(true);
    timerRef.current = setTimeout(() => {
      triggeredRef.current = true;
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(50);
      }
      onLongPress(e);
    }, delay);
  }, [delay, onLongPress]);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsPressing(false);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    start(e);
  }, [start]);

  const handleTouchEnd = useCallback(() => {
    clear();
    if (!triggeredRef.current && onClick) {
      onClick();
    }
  }, [clear, onClick]);

  const handleTouchMove = useCallback(() => {
    clear();
  }, [clear]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only left button
    if (e.button !== 0) return;
    start(e);
  }, [start]);

  const handleMouseUp = useCallback(() => {
    clear();
    if (!triggeredRef.current && onClick) {
      onClick();
    }
  }, [clear, onClick]);

  const handleMouseLeave = useCallback(() => {
    clear();
  }, [clear]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    triggeredRef.current = true;
    onLongPress(e);
  }, [onLongPress]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return {
    isPressing,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchEnd: handleTouchEnd,
      onTouchMove: handleTouchMove,
      onTouchCancel: handleTouchMove,
      onMouseDown: handleMouseDown,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseLeave,
      onContextMenu: handleContextMenu,
    },
  };
}
