import { useEffect, useRef } from "react";
import { TreeViewRefApi } from "@thirdroom/manifold-editor-components";
import { useAtomValue } from "jotai";
import { Room } from "@thirdroom/hydrogen-view-sdk";

import "./EditorView.css";
import { useEditor } from "../../../hooks/useEditor";
import { HierarchyPanel } from "./HierarchyPanel";
import { useMainThreadContext } from "../../../hooks/useMainThread";
import { getLocalResource, MainThreadResource } from "../../../../engine/resource/resource.main";
import { PropertiesPanel } from "./PropertiesPanel";
import { editorAtom, EditorMode, editorModeAtom } from "../../../state/editor";
import { ScriptEditor } from "./ScriptEditor";
import { EditorToolbar } from "./EditorToolbar";
import { useEvent } from "../../../hooks/useEvent";

export function EditorView({ room }: { room?: Room }) {
  const treeViewRef = useRef<TreeViewRefApi>(null);
  const { loading, scene, resources } = useEditor(treeViewRef);
  const activeEntity = useAtomValue(editorAtom).activeEntity;
  const mainThread = useMainThreadContext();
  const resource = getLocalResource(mainThread, activeEntity) as unknown as MainThreadResource;
  const editorMode = useAtomValue(editorModeAtom);

  useEffect(() => {
    document.exitPointerLock();
    return () => {
      mainThread.canvas?.requestPointerLock();
    };
  }, [mainThread]);

  useEvent(
    "mousedown",
    (e) => {
      const evt = e as unknown as MouseEvent;
      if (evt.button === 2) {
        evt.preventDefault();
        evt.stopPropagation();
        mainThread.canvas?.requestPointerLock();
      }
    },
    mainThread.canvas,
    []
  );
  useEvent(
    "mouseup",
    (e) => {
      const evt = e as unknown as MouseEvent;
      if (evt.button === 2) {
        evt.preventDefault();
        evt.stopPropagation();
        document.exitPointerLock();
      }
    },
    mainThread.canvas,
    []
  );

  useEvent(
    "contextmenu",
    (e) => {
      e.preventDefault();
    },
    mainThread.canvas,
    []
  );

  return (
    <div className="EditorView flex flex-column gap-xs">
      {!loading && scene && (
        <>
          <div className="EditorView__toolbar shrink-0">
            <EditorToolbar />
          </div>
          <div className="grow flex gap-xs">
            <div className="EditorView__centerPanel grow flex justify-center items-start">
              {editorMode === EditorMode.ScriptEditor && room && <ScriptEditor room={room} />}
            </div>
            <div className="EditorView__rightPanel grow flex flex-column gap-xs">
              <HierarchyPanel scene={scene} resources={resources} treeViewRef={treeViewRef} />
              {(editorMode === EditorMode.SceneEditor || editorMode === EditorMode.SceneInspector) &&
                typeof resource === "object" && <PropertiesPanel resource={resource} />}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
