import { RefObject, useState, useEffect, createContext, useContext } from "react";

import { initEngine, Engine } from "../../engine/MainThread";
import { useIsMounted } from "./useIsMounted";

export function useInitEngine(canvasRef: RefObject<HTMLCanvasElement>) {
  const [engine, setEngine] = useState<Engine>();
  const isMounted = useIsMounted();

  useEffect(() => {
    let _engine: Engine | undefined;

    if (canvasRef.current) {
      initEngine(canvasRef.current)
        .then((engine) => {
          if (isMounted()) {
            _engine = engine;
            setEngine(engine);
          } else {
            engine.dispose();
          }
        })
        .catch(console.error);
    }

    return () => {
      _engine?.dispose();
    };
  }, [isMounted, canvasRef]);

  useEffect(() => {
    const global = window as unknown as any;

    if (!global.thirdroom) {
      global.thirdroom = {};
    }

    if (engine) {
      global.thirdroom.exportScene = () => {
        engine.exportScene();
      };
    } else {
      global.thirdroom.exportScene = () => {};
    }

    return () => {
      if (global.thirdroom) {
        global.thirdroom.exportScene = () => {};
      }
    };
  }, [engine]);

  return engine;
}

const EngineContext = createContext<Engine | undefined>(undefined);

export const EngineContextProvider = EngineContext.Provider;

export function useEngine() {
  const engine = useContext(EngineContext);

  if (!engine) {
    throw new Error("Engine hasn't been initialized yet");
  }

  return engine;
}
