import "./EditorView.css";
import { useEditor } from "../../../hooks/useEditor";
import { PropertiesPanel } from "./PropertiesPanel";
import { HierarchyPanel } from "./HierarchyPanel";

export function EditorView() {
  const loading = useEditor();
  return (
    <>
      {loading ? null : (
        <div className="EditorView_rightPanel gap-xs">
          <HierarchyPanel />
          <PropertiesPanel />
        </div>
      )}
    </>
  );
}
