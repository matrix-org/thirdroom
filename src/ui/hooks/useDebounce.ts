import { useCallback, useRef } from "react";

interface DebounceOptions {
  wait?: number;
  immediate?: boolean;
}

export function useDebounce(callback: (...args: any[]) => void, options?: DebounceOptions): (...args: any[]) => void {
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const { wait, immediate } = options ?? {};

  const debounceCallback = useCallback(
    (...cbArgs) => {
      if (timeoutIdRef.current !== null) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      } else if (immediate) {
        callback(...cbArgs);
      }

      timeoutIdRef.current = setTimeout(() => {
        callback(...cbArgs);
        timeoutIdRef.current = null;
      }, wait);
    },
    [callback, wait, immediate]
  );

  return debounceCallback;
}
