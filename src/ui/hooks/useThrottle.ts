import { useCallback, useRef, useEffect } from "react";

export function useThrottle<T extends any[]>(callback: (...args: T) => void, interval = 100): (...args: T) => void {
  const timeoutIdRef = useRef<number | undefined>();
  const lastCalled = useRef<number>(0);

  const throttledCallback = useCallback(
    (...cbArgs: T) => {
      const now = Date.now();

      if (now >= lastCalled.current + interval) {
        callback(...cbArgs);
      } else {
        clearTimeout(timeoutIdRef.current);

        timeoutIdRef.current = window.setTimeout(() => {
          lastCalled.current = now;
          callback(...cbArgs);
        });
      }

      lastCalled.current = now;
    },
    [callback, interval]
  );

  useEffect(() => {
    return () => {
      clearTimeout(timeoutIdRef.current);
    };
  }, []);

  return throttledCallback;
}
