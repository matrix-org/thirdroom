import { RefObject, useCallback, useEffect, useRef } from "react";

import { initMainThread, MainThread } from "../../engine/MainThread";

export function useEngine(canvasRef: RefObject<HTMLCanvasElement>) {
  const mainThreadRef = useRef<MainThread>();

  useEffect(() => {
    if (canvasRef.current) {
      initMainThread(canvasRef.current)
        .then((result) => (mainThreadRef.current = result))
        .catch(console.error);
    }

    return mainThreadRef.current?.dispose();
  }, [canvasRef]);

  const getStats = useCallback(() => {
    return mainThreadRef.current?.getStats();
  }, []);

  return { getStats };
}
