import "./EditorView.css";
import { useEditor } from "../../../hooks/useEditor";
import { HierarchyPanel } from "./HierarchyPanel";

export function EditorView() {
  const { loading, scene } = useEditor();
  return (
    <>
      {loading ? null : (
        <div className="EditorView_rightPanel gap-xs">
          <HierarchyPanel scene={scene!} />
        </div>
      )}
    </>
  );
}
