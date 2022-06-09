import { useState, useEffect } from "react";

import { EditorEventType, Selection } from "../../engine/editor/editor.common";
import { EditorModule } from "../../engine/editor/editor.main";
import { getModule } from "../../engine/module/module.common";
import { useMainThreadContext } from "./useMainThread";

export function useEditorSelection(): Selection {
  const mainThread = useMainThreadContext();
  const editor = getModule(mainThread, EditorModule);
  const [selection, setSelection] = useState({
    activeEntity: editor.activeEntity,
    activeEntityComponents: editor.activeEntityComponents,
    selectedEntities: editor.selectedEntities,
  });

  useEffect(() => {
    editor.addListener(EditorEventType.SelectionChanged, setSelection);

    return () => {
      editor.removeListener(EditorEventType.SelectionChanged, setSelection);
    };
  }, [editor]);

  return selection;
}
