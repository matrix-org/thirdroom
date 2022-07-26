import "./EditorView.css";
import { useEditor } from "../../../hooks/useEditor";
import { HierarchyPanel } from "./HierarchyPanel";

export function EditorView() {
  const { loading, scene, activeEntity, selectedEntities } = useEditor();
  return (
    <>
      {loading || !scene ? null : (
        <div className="EditorView_rightPanel gap-xs">
          <HierarchyPanel activeEntity={activeEntity} selectedEntities={selectedEntities} scene={scene} />
        </div>
      )}
    </>
  );
}
