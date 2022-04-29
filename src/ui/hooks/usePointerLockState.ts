import { useCallback, useState } from "react";

import { usePointerLockChange } from "./usePointerLockChange";

export function usePointerLockState(targetEl: HTMLElement | null): boolean {
  const [pointerLocked, setPointerLocked] = useState(targetEl ? document.pointerLockElement === targetEl : false);

  const onPointerLockChange = useCallback((isLocked: boolean) => {
    setPointerLocked(isLocked);
  }, []);

  usePointerLockChange(targetEl, onPointerLockChange, []);

  return pointerLocked;
}
