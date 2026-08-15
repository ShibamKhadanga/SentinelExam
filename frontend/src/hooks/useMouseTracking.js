import { useRef, useCallback, useState, useEffect } from 'react';

/**
 * Hook to track mouse movement patterns.
 * Samples position, computes velocity, and detects idle periods.
 */
export function useMouseTracking() {
  const [mouseEvents, setMouseEvents] = useState([]);
  const isTracking = useRef(false);
  const lastPosition = useRef(null);

  const handleMouseMove = useCallback((e) => {
    if (!isTracking.current) return;

    const event = {
      x: e.clientX,
      y: e.clientY,
      timestamp: Date.now(),
      event_type: 'move',
    };

    setMouseEvents((prev) => {
      // Throttle: only record every ~16ms (60fps)
      if (prev.length > 0) {
        const last = prev[prev.length - 1];
        if (event.timestamp - last.timestamp < 16) return prev;
      }
      return [...prev, event];
    });

    lastPosition.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleClick = useCallback((e) => {
    if (!isTracking.current) return;

    setMouseEvents((prev) => [...prev, {
      x: e.clientX,
      y: e.clientY,
      timestamp: Date.now(),
      event_type: 'click',
    }]);
  }, []);

  const startTracking = useCallback(() => {
    isTracking.current = true;
    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('click', handleClick, { passive: true });
  }, [handleMouseMove, handleClick]);

  const stopTracking = useCallback(() => {
    isTracking.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('click', handleClick);
  }, [handleMouseMove, handleClick]);

  const reset = useCallback(() => {
    setMouseEvents([]);
    lastPosition.current = null;
  }, []);

  const getAndReset = useCallback(() => {
    const current = [...mouseEvents];
    reset();
    return current;
  }, [mouseEvents, reset]);

  useEffect(() => {
    return () => stopTracking();
  }, [stopTracking]);

  return {
    mouseEvents,
    startTracking,
    stopTracking,
    reset,
    getAndReset,
    eventCount: mouseEvents.length,
  };
}
