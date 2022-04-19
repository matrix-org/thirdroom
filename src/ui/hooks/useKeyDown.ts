import { useEffect } from "react";

export function useKeyDown(callback: (e: KeyboardEvent) => void, deps: unknown[]) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      callback(e);
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
