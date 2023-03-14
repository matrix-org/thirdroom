import { useRef } from "react";
import { TreeViewRefApi } from "@thirdroom/manifold-editor-components";
import { useAtomValue } from "jotai";

import "./EditorView.css";
import { useEditor } from "../../../hooks/useEditor";
import { HierarchyPanel } from "./HierarchyPanel";
import { useMainThreadContext } from "../../../hooks/useMainThread";
import { getLocalResource, MainThreadResource } from "../../../../engine/resource/resource.main";
import { PropertiesPanel } from "./PropertiesPanel";
import { editorAtom } from "../../../state/editor";

export function EditorView() {
  const treeViewRef = useRef<TreeViewRefApi>(null);
  const { loading, scene, resources } = useEditor(treeViewRef);
  const activeEntity = useAtomValue(editorAtom).activeEntity;

  const mainThread = useMainThreadContext();
  const resource = getLocalResource(mainThread, activeEntity) as unknown as MainThreadResource;

  return (
    <>
      {loading || !scene ? null : (
        <>
          <div className="EditorView__leftPanel">
            <HierarchyPanel scene={scene} resources={resources} treeViewRef={treeViewRef} />
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
