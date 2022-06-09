import { useState, useEffect, useCallback } from "react";

import { ComponentInfo } from "../../engine/component/types";
import { EditorEventType } from "../../engine/editor/editor.common";
import { EditorModule, sendRemoveComponentMessage } from "../../engine/editor/editor.main";
import { getModule } from "../../engine/module/module.common";
import { useMainThreadContext } from "./useMainThread";

export function useComponent(componentId: number): (ComponentInfo & { removeComponent(): void }) | undefined {
  const mainThread = useMainThreadContext();
  const editor = getModule(mainThread, EditorModule);

  const [componentInfo, setComponentInfo] = useState(() => editor.componentInfoMap.get(componentId));

  useEffect(() => {
    function onComponentInfoChanged(componentId: number, componentInfo: ComponentInfo) {
      if (componentId === componentId) {
        setComponentInfo(componentInfo);
      }
    }

    editor.addListener(EditorEventType.ComponentInfoChanged, onComponentInfoChanged);

    setComponentInfo(editor.componentInfoMap.get(componentId));

    return () => {
      editor.removeListener(EditorEventType.ComponentInfoChanged, onComponentInfoChanged);
    };
  }, [editor, componentId]);

  const removeComponent = useCallback(() => {
    sendRemoveComponentMessage(mainThread, componentId);
  }, [mainThread, componentId]);

  if (!componentInfo) {
    return;
  }

  return { ...componentInfo, removeComponent };
}
