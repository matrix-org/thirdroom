import "./EditorView.css";
import { useEditor } from "../../../hooks/useEditor";
import { PropertiesPanel } from "./PropertiesPanel";

export function EditorView() {
  const loading = useEditor();
  return (
    <>
      {loading ? null : (
        <div className="EditorView_rightPanel">
          <PropertiesPanel />
        </div>
      )}
    </>
  );
}
