import { useEffect, useState } from "react";

import { useEngine } from "./useEngine";
import { EditorEventType } from "../../engine/editor/editor.common";

export function useEditor(): boolean {
  const engine = useEngine();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    function onEditorLoaded() {
      setLoading(false);
    }

    engine.addListener(EditorEventType.EditorLoaded, onEditorLoaded);
    engine.loadEditor();

    return () => {
      engine.disposeEditor();
      engine.removeListener(EditorEventType.EditorLoaded, onEditorLoaded);
    };
  }, [engine]);

  return loading;
}
