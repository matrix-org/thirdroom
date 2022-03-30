import { RefObject, useEffect } from "react";
import { initMainThread } from "../../engine/MainThread";

export function useEngine(canvasRef: RefObject<HTMLCanvasElement>) {
  useEffect(() => {
    let dispose: Function | undefined = undefined;

    if (canvasRef.current) {
      initMainThread(canvasRef.current)
        .then((result) => dispose = result.dispose)
        .catch(console.error);
    }

    return dispose;
  }, [canvasRef]);
}