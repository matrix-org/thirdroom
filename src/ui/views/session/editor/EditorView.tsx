import { useRef } from "react";
import { TreeViewRefApi } from "@thirdroom/manifold-editor-components";

import "./EditorView.css";
import { useEditor } from "../../../hooks/useEditor";
import { HierarchyPanel } from "./HierarchyPanel";
import { useMainThreadContext } from "../../../hooks/useMainThread";
import { getLocalResource, MainThreadResource } from "../../../../engine/resource/resource.main";
import { PropertiesPanel } from "./PropertiesPanel";

export function EditorView() {
  const treeViewRef = useRef<TreeViewRefApi>(null);
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
    goToRef,
  } = useEditor(treeViewRef);

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
              treeViewRef={treeViewRef}
            />
          </div>
          {typeof resource === "object" && (
            <div className="EditorView__rightPanel">
              <PropertiesPanel resource={resource} goToRef={goToRef} />
            </div>
          )}
        </>
      )}
    </>
  );
}
