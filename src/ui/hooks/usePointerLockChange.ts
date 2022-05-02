import React, { useEffect, useCallback } from "react";

export function usePointerLockChange(
  targetEl: HTMLElement | null,
  callback: (isLocked: boolean) => void,
  deps: React.DependencyList
) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoCallback = useCallback(callback, deps);

  useEffect(() => {
    const onPointerLockChange = () => {
      memoCallback(targetEl ? document.pointerLockElement === targetEl : false);
    };

    document.addEventListener("pointerlockchange", onPointerLockChange);
    return () => {
      document.removeEventListener("pointerlockchange", onPointerLockChange);
    };
  }, [targetEl, memoCallback]);
}
