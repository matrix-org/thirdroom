import { RefObject, useState, useEffect, createContext, useContext, useRef } from "react";

import { IMainThreadContext, MainThread } from "../../engine/MainThread";
import { GraphicsQualitySetting } from "../../engine/renderer/renderer.common";
import { useIsMounted } from "./useIsMounted";

export function useInitMainThreadContext(canvasRef: RefObject<HTMLCanvasElement>, quality?: GraphicsQualitySetting) {
  const [context, setContext] = useState<IMainThreadContext>();
  const isMounted = useIsMounted();
  const qualityRef = useRef(quality);

  useEffect(() => {
    if (canvasRef.current) {
      let disposeFn: () => void | undefined;

      MainThread(canvasRef.current, { quality: qualityRef.current }).then(({ context, dispose }) => {
        if (!isMounted()) {
          dispose();
        } else {
          disposeFn = dispose;
          setContext(context);
        }
      });

      return () => {
        if (disposeFn) {
          disposeFn();
        }
      };
    }
  }, [isMounted, canvasRef]);

  // TODO: Implement engine APIs

  return context;
}

const MainThreadUIContext = createContext<IMainThreadContext | undefined>(undefined);

export const MainThreadContextProvider = MainThreadUIContext.Provider;

export function useMainThreadContext() {
  const context = useContext(MainThreadUIContext);

  if (!context) {
    throw new Error("Main Thread hasn't been initialized yet");
  }

  return context;
}
