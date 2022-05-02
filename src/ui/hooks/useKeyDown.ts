import React, { useCallback, useEffect } from "react";

export function useKeyDown(callback: (e: KeyboardEvent) => void, deps: React.DependencyList) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoCallback = useCallback(callback, deps);

  useEffect(() => {
    window.addEventListener("keydown", memoCallback);
    return () => {
      window.removeEventListener("keydown", memoCallback);
    };
  }, [memoCallback]);
}
