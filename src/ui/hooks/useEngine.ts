import { RefObject, useCallback, useEffect, useRef, useState } from "react";
import {
  Engine,
  EngineState,
  createEngine,
  loadEngine,
  loadWorld,
  enterWorld,
  exitWorld,
  disposeEngine,
} from "../../engine/initEngine";

interface UseEngineProps {
  state: EngineState;
  error?: Error;
  enterWorld: () => void;
  exitWorld: () => void;
}

export function useEngine(canvasRef: RefObject<HTMLCanvasElement>, sceneUrl?: string): UseEngineProps {
  const engineRef = useRef<Engine>();
  const [engineState, setEngineState] = useState({
    state: EngineState.Uninitialized,
    error: undefined
  });

  useEffect(() => {
    function onEngineStateChanged(state: EngineState) {
      setEngineState({ state, error: undefined });
    }

    let engine: Engine | undefined;

    if (canvasRef.current) {
      engine = engineRef.current = createEngine();
      (window as unknown as any)["engine"] = engine;
      engine.addListener("state-changed", onEngineStateChanged);
      loadEngine(engine, canvasRef.current).then(() => {
        if (engineRef.current && sceneUrl) {
          loadWorld(engineRef.current, sceneUrl);
        }
      });
    }

    return () => {
      if (engine) {
        engine.removeListener("state-changed", onEngineStateChanged);
        disposeEngine(engine); 
        engineRef.current = undefined;
      }
    };
  }, []);

  useEffect(() => {
    if (engineRef.current && engineRef.current.state !== EngineState.Uninitialized && sceneUrl) {
      loadWorld(engineRef.current, sceneUrl);
    }
  }, [sceneUrl]);

  const onEnterWorld = useCallback(() => {
    if (!engineRef.current) {
      console.warn("Cannot enter world before engine has loaded.");
      return;
    }

    enterWorld(engineRef.current);
  }, []);

  const onExitWorld = useCallback(() => {
    if (!engineRef.current) {
      console.warn("Cannot exit world before engine has loaded.");
      return;
    }

    exitWorld(engineRef.current);
  }, []);

  return {
    ...engineState,
    enterWorld: onEnterWorld,
    exitWorld: onExitWorld,
  };
}