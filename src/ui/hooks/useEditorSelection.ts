import { useState, useEffect } from "react";

import { EditorEventType, Selection } from "../../engine/editor/editor.common";
import { EditorScope } from "../../engine/editor/editor.main";
import { getScope } from "../../engine/types/types.common";
import { useMainThreadContext } from "./useMainThread";

export function useEditorSelection(): Selection {
  const mainThread = useMainThreadContext();
  const editor = getScope(mainThread, EditorScope);
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
