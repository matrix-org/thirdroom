import { useState, useEffect, useCallback } from "react";

import { ComponentInfo } from "../../engine/component/types";
import { EditorEventType } from "../../engine/editor/editor.common";
import { useEngine } from "./useEngine";

export function useComponent(componentId: number): (ComponentInfo & { removeComponent(): void }) | undefined {
  const engine = useEngine();
  const [componentInfo, setComponentInfo] = useState(() => engine.getComponentInfo(componentId));

  useEffect(() => {
    function onComponentInfoChanged(componentId: number, componentInfo: ComponentInfo) {
      if (componentId === componentId) {
        setComponentInfo(componentInfo);
      }
    }

    engine.addListener(EditorEventType.ComponentInfoChanged, onComponentInfoChanged);

    setComponentInfo(engine.getComponentInfo(componentId));

    return () => {
      engine.removeListener(EditorEventType.ComponentInfoChanged, onComponentInfoChanged);
    };
  }, [engine, componentId]);

  const removeComponent = useCallback(() => {
    engine.removeComponent(componentId);
  }, [engine, componentId]);

  if (!componentInfo) {
    return;
  }

  return { ...componentInfo, removeComponent };
}
