import "./EditorView.css";
import { useEditor } from "../../../hooks/useEditor";
import { HierarchyPanel } from "./HierarchyPanel";
import { useMainThreadContext } from "../../../hooks/useMainThread";
import { getLocalResource, MainThreadResource } from "../../../../engine/resource/resource.main";
import { PropertiesPanel } from "./PropertiesPanel";

export function EditorView() {
  const {
    loading,
    scene,
    resources,
    activeEntity,
    selectedEntities,
    hierarchyTab,
    setHierarchyTab,
    resourceOptions,
    resourceType,
    setResourceType,
  } = useEditor();

  const mainThread = useMainThreadContext();
  const resource = getLocalResource(mainThread, activeEntity) as unknown as MainThreadResource;

  return (
    <>
      {loading || !scene ? null : (
        <>
          <div className="EditorView__leftPanel">
            <HierarchyPanel
              activeEntity={activeEntity}
              selectedEntities={selectedEntities}
              scene={scene}
              resources={resources}
              hierarchyTab={hierarchyTab}
              setHierarchyTab={setHierarchyTab}
              resourceOptions={resourceOptions}
              setResourceType={setResourceType}
              resourceType={resourceType}
            />
          </div>
          {typeof resource === "object" && (
            <div className="EditorView__rightPanel">
              <PropertiesPanel resource={resource} />
            </div>
          )}
        </>
      )}
    </>
  );
}
