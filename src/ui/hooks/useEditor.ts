import { useEffect, useState } from "react";

import { useMainThreadContext } from "./useMainThread";
import { EditorEventType } from "../../engine/editor/editor.common";
import { getModule } from "../../engine/module/module.common";
import { EditorModule, sendDisposeEditorMessage, sendLoadEditorMessage } from "../../engine/editor/editor.main";

export function useEditor(): boolean {
  const mainThread = useMainThreadContext();
  const editor = getModule(mainThread, EditorModule);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    function onEditorLoaded() {
      setLoading(false);
    }

    editor.addListener(EditorEventType.EditorLoaded, onEditorLoaded);
    sendLoadEditorMessage(mainThread);

    return () => {
      sendDisposeEditorMessage(mainThread);
      editor.removeListener(EditorEventType.EditorLoaded, onEditorLoaded);
    };
  }, [editor, mainThread]);

  return loading;
}
