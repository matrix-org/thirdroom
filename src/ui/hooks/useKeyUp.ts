import { useCallback, useEffect, DependencyList } from "react";

export function useKeyUp(callback: (e: KeyboardEvent) => void, deps: DependencyList) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoCallback = useCallback(callback, deps);

  useEffect(() => {
    window.addEventListener("keyup", memoCallback);
    return () => {
      window.removeEventListener("keyup", memoCallback);
    };
  }, [memoCallback]);
}
