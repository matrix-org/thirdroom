import { useCallback, useEffect, DependencyList } from "react";

export function useKeyDown(callback: (e: KeyboardEvent) => void, deps: DependencyList) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoCallback = useCallback(callback, deps);

  useEffect(() => {
    window.addEventListener("keydown", memoCallback);
    return () => {
      window.removeEventListener("keydown", memoCallback);
    };
  }, [memoCallback]);
}
