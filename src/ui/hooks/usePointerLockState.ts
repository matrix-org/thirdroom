import { useEffect, useState } from "react";

export function usePointerLockState(targetEl: HTMLElement | null) {
  const [pointerLocked, setPointerLocked] = useState(targetEl && document.pointerLockElement === targetEl);

  useEffect(() => {
    const onPointerLockChange = () => {
      setPointerLocked(targetEl && document.pointerLockElement === targetEl);
    };

    setPointerLocked(targetEl && document.pointerLockElement === targetEl);

    document.addEventListener("pointerlockchange", onPointerLockChange);

    return () => {
      document.removeEventListener("pointerlockchange", onPointerLockChange);
    };
  }, [targetEl]);

  return pointerLocked;
}
