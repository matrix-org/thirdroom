import { useEffect, useState } from "react";

export function usePointerLockState(targetEl: HTMLElement | null): boolean {
  const [pointerLocked, setPointerLocked] = useState(targetEl ? document.pointerLockElement === targetEl : false);

  useEffect(() => {
    const onPointerLockChange = () => {
      setPointerLocked(targetEl ? document.pointerLockElement === targetEl : false);
    };

    setPointerLocked(targetEl ? document.pointerLockElement === targetEl : false);

    document.addEventListener("pointerlockchange", onPointerLockChange);

    return () => {
      document.removeEventListener("pointerlockchange", onPointerLockChange);
    };
  }, [targetEl]);

  return pointerLocked;
}
