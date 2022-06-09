import { RefObject, useState, useEffect, createContext, useContext } from "react";

import { IMainThreadContext, MainThread } from "../../engine/MainThread";
import { useIsMounted } from "./useIsMounted";

export function useInitMainThreadContext(canvasRef: RefObject<HTMLCanvasElement>) {
  const [context, setContext] = useState<IMainThreadContext>();
  const isMounted = useIsMounted();

  useEffect(() => {
    if (canvasRef.current) {
      let disposeFn: () => void | undefined;

      MainThread(canvasRef.current).then(({ context, dispose }) => {
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
