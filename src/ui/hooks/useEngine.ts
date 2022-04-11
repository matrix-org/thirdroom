import { RefObject, useCallback, useEffect, useRef } from "react";

import { initMainThread, MainThread } from "../../engine/MainThread";

export function useEngine(canvasRef: RefObject<HTMLCanvasElement>) {
  const mainThreadRef = useRef<MainThread>();

  useEffect(() => {
    const global = window as unknown as any;

    if (!global.thirdroom) {
      global.thirdroom = {};
    }

    global.thirdroom.exportScene = () => {};

    if (canvasRef.current) {
      initMainThread(canvasRef.current)
        .then((result) => {
          global.thirdroom.exportScene = () => {
            result.exportScene();
          };

          mainThreadRef.current = result;
        })
        .catch(console.error);
    }

    return () => {
      if (global.thirdroom) {
        global.thirdroom.exportScene = () => {};
      }

      mainThreadRef.current?.dispose();
    };
  }, [canvasRef]);

  const getStats = useCallback(() => {
    return mainThreadRef.current?.getStats();
  }, []);

  const exportScene = useCallback(() => {
    return mainThreadRef.current?.exportScene();
  }, []);

  return { getStats, exportScene };
}
