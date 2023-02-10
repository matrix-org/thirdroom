import "./EditorView.css";
import { useEditor } from "../../../hooks/useEditor";
import { HierarchyPanel } from "./HierarchyPanel";
import { useMainThreadContext } from "../../../hooks/useMainThread";
import { getLocalResource, MainNode } from "../../../../engine/resource/resource.main";
import { PropertiesPanel } from "./PropertiesPanel";

export function EditorView() {
  const { loading, scene, resources, activeEntity, selectedEntities } = useEditor();

  const mainThread = useMainThreadContext();
  const resource = getLocalResource<MainNode>(mainThread, activeEntity);

  return (
    <>
      {loading || !resources || !scene ? null : (
        <>
          <div className="EditorView__leftPanel">
            <HierarchyPanel
              activeEntity={activeEntity}
              selectedEntities={selectedEntities}
              scene={scene}
              resources={resources}
            />
          </div>
          {resource && (
            <div className="EditorView__rightPanel">
              <PropertiesPanel resource={resource} />
            </div>
          )}
        </>
      )}
    </>
  );
}
