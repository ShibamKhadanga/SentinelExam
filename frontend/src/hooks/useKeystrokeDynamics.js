import { useRef, useCallback, useState } from 'react';

/**
 * Hook to capture keystroke dynamics (dwell time + flight time).
 * Uses performance.now() for sub-millisecond precision.
 */
export function useKeystrokeDynamics() {
  const keyDownTimes = useRef({});
  const lastKeyUpTime = useRef(null);
  const [keystrokes, setKeystrokes] = useState([]);

  const handleKeyDown = useCallback((e) => {
    // Ignore auto-repeat events
    if (keyDownTimes.current[e.code]) return;

    keyDownTimes.current[e.code] = {
      code: e.code,
      key: e.key,
      downTime: performance.now(),
      timestamp: Date.now(),
    };
  }, []);

  const handleKeyUp = useCallback((e) => {
    const downData = keyDownTimes.current[e.code];
    if (!downData) return;

    const upTime = performance.now();
    const dwellTime = upTime - downData.downTime;

    let flightTime = null;
    if (lastKeyUpTime.current !== null) {
      flightTime = downData.downTime - lastKeyUpTime.current;
    }

    const event = {
      key: downData.key,
      code: downData.code,
      dwell_time: Math.round(dwellTime * 100) / 100,
      flight_time: flightTime !== null ? Math.round(flightTime * 100) / 100 : null,
      timestamp: downData.timestamp,
    };

    setKeystrokes((prev) => [...prev, event]);
    lastKeyUpTime.current = upTime;
    delete keyDownTimes.current[e.code];
  }, []);

  const reset = useCallback(() => {
    setKeystrokes([]);
    keyDownTimes.current = {};
    lastKeyUpTime.current = null;
  }, []);

  const getAndReset = useCallback(() => {
    const current = [...keystrokes];
    reset();
    return current;
  }, [keystrokes, reset]);

  return {
    keystrokes,
    handleKeyDown,
    handleKeyUp,
    reset,
    getAndReset,
    keystrokeCount: keystrokes.length,
  };
}
