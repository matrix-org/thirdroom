import { useEffect, useState } from "react";

import { useMainThreadContext } from "./useMainThread";
import { getModule } from "../../engine/module/module.common";
import { EditorModule, loadEditor, disposeEditor, EditorEventType } from "../../engine/editor/editor.main";
import { EditorNode } from "../../engine/editor/editor.common";

interface EditorUIState {
  loading: boolean;
  scene?: EditorNode;
}

export function useEditor(): EditorUIState {
  const mainThread = useMainThreadContext();
  const editor = getModule(mainThread, EditorModule);
  const [state, setState] = useState<EditorUIState>({
    loading: true,
  });

  useEffect(() => {
    function onEditorLoaded(scene: EditorNode) {
      setState({ loading: false, scene });
    }

    editor.eventEmitter.addListener(EditorEventType.EditorLoaded, onEditorLoaded);
    loadEditor(mainThread);

    return () => {
      disposeEditor(mainThread);
      editor.eventEmitter.removeListener(EditorEventType.EditorLoaded, onEditorLoaded);
    };
  }, [editor, mainThread]);

  return state;
}
