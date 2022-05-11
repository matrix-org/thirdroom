import { useState, useEffect } from "react";

import { EditorEventType, Selection } from "../../engine/editor/editor.common";
import { useEngine } from "./useEngine";

export function useEditorSelection(): Selection {
  const engine = useEngine();
  const [selection, setSelection] = useState(engine.getSelection());

  useEffect(() => {
    engine.setState(engine.getSelection());
    engine.addListener(EditorEventType.SelectionChanged, setSelection);

    return () => {
      engine.removeListener(EditorEventType.SelectionChanged, setSelection);
    };
  }, [engine]);

  return selection;
}
