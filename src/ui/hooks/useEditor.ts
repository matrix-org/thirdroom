import { useEffect, useState } from "react";

import { useMainThreadContext } from "./useMainThread";
import { EditorEventType } from "../../engine/editor/editor.common";
import { getScope } from "../../engine/module/module.common";
import { EditorScope, sendDisposeEditorMessage, sendLoadEditorMessage } from "../../engine/editor/editor.main";

export function useEditor(): boolean {
  const mainThread = useMainThreadContext();
  const editor = getScope(mainThread, EditorScope);
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
