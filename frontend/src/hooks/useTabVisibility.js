import { useCallback, useState, useEffect, useRef } from 'react';

/**
 * Hook to track tab visibility changes and window blur/focus events.
 */
export function useTabVisibility() {
  const [tabEvents, setTabEvents] = useState([]);
  const lastBlurTime = useRef(null);
  const isTracking = useRef(false);

  const handleVisibilityChange = useCallback(() => {
    if (!isTracking.current) return;

    const now = Date.now();
    if (document.hidden) {
      lastBlurTime.current = now;
      setTabEvents((prev) => [...prev, {
        event_type: 'blur',
        timestamp: now,
        duration: null,
      }]);
    } else {
      const duration = lastBlurTime.current ? now - lastBlurTime.current : null;
      setTabEvents((prev) => [...prev, {
        event_type: 'focus',
        timestamp: now,
        duration,
      }]);
      lastBlurTime.current = null;
    }
  }, []);

  const handleBlur = useCallback(() => {
    if (!isTracking.current) return;
    lastBlurTime.current = Date.now();
    setTabEvents((prev) => [...prev, {
      event_type: 'blur',
      timestamp: Date.now(),
      duration: null,
    }]);
  }, []);

  const handleFocus = useCallback(() => {
    if (!isTracking.current) return;
    const now = Date.now();
    const duration = lastBlurTime.current ? now - lastBlurTime.current : null;
    setTabEvents((prev) => [...prev, {
      event_type: 'focus',
      timestamp: now,
      duration,
    }]);
    lastBlurTime.current = null;
  }, []);

  const startTracking = useCallback(() => {
    isTracking.current = true;
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
  }, [handleVisibilityChange, handleBlur, handleFocus]);

  const stopTracking = useCallback(() => {
    isTracking.current = false;
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('blur', handleBlur);
    window.removeEventListener('focus', handleFocus);
  }, [handleVisibilityChange, handleBlur, handleFocus]);

  const reset = useCallback(() => {
    setTabEvents([]);
    lastBlurTime.current = null;
  }, []);

  const getAndReset = useCallback(() => {
    const current = [...tabEvents];
    reset();
    return current;
  }, [tabEvents, reset]);

  useEffect(() => {
    return () => stopTracking();
  }, [stopTracking]);

  return {
    tabEvents,
    startTracking,
    stopTracking,
    reset,
    getAndReset,
    blurCount: tabEvents.filter((e) => e.event_type === 'blur').length,
  };
}
