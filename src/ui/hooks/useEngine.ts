import { RefObject, useCallback, useEffect, useRef, useState } from "react";
import { initEngine, Engine, EngineState } from "../../engine/initEngine";

export function useEngine(canvasRef: RefObject<HTMLCanvasElement>) {
  const engineRef = useRef<Engine>();
  const [engineState, setEngineState] = useState({
    state: EngineState.Uninitialized,
    error: null
  });

  useEffect(() => {
    function onEngineStateChanged(state: EngineState) {
      setEngineState({ state, error: null });
    }

    if (canvasRef.current) {
      engineRef.current = initEngine(canvasRef.current);
      engineRef.current.addListener("state-changed", onEngineStateChanged);
    }

    return () => {
      if (engineRef.current) {
        engineRef.current.dispose();
        engineRef.current.removeListener("state-changed", onEngineStateChanged);
      }
    };
  }, []);

  const loadWorld = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.loadWorld();
  }, []);

  const enterWorld = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.enterWorld();
  }, []);

  const exitWorld = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.exitWorld();
  }, []);

  const dispose = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.dispose();
  }, []);

  return { ...engineState, loadWorld, enterWorld, exitWorld, dispose };
}