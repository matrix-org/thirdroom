import { useEffect, useRef } from "react";
import { TreeViewRefApi } from "@thirdroom/manifold-editor-components";
import { useAtom, useAtomValue } from "jotai";
import { Room } from "@thirdroom/hydrogen-view-sdk";

import "./EditorView.css";
import { useEditor } from "../../../hooks/useEditor";
import { HierarchyPanel } from "./HierarchyPanel";
import { useMainThreadContext } from "../../../hooks/useMainThread";
import { getLocalResource, MainThreadResource } from "../../../../engine/resource/resource.main";
import { PropertiesPanel } from "./PropertiesPanel";
import { editorAtom, showCodeEditorAtom } from "../../../state/editor";
import { ScriptEditor } from "./ScriptEditor";
import { Button } from "../../../atoms/button/Button";

export function EditorView({ room }: { room?: Room }) {
  const treeViewRef = useRef<TreeViewRefApi>(null);
  const { loading, scene, resources } = useEditor(treeViewRef);
  const activeEntity = useAtomValue(editorAtom).activeEntity;
  const mainThread = useMainThreadContext();
  const resource = getLocalResource(mainThread, activeEntity) as unknown as MainThreadResource;
  const [showCodeEditor, setShowCodeEditor] = useAtom(showCodeEditorAtom);

  useEffect(() => {
    document.exitPointerLock();
    return () => {
      mainThread.canvas?.requestPointerLock();
    };
  }, [mainThread]);

  return (
    <div className="EditorView flex gap-md">
      {!loading && scene && (
        <>
          <div className="EditorView__leftPanel grow">
            <HierarchyPanel scene={scene} resources={resources} treeViewRef={treeViewRef} />
          </div>
          <div className="EditorView__centerPanel grow flex justify-center items-start">
            {showCodeEditor ? (
              room && <ScriptEditor room={room} />
            ) : (
              <div className="EditorView__toolbar">
                <Button size="sm" onClick={() => setShowCodeEditor(true)}>
                  Open Script Editor
                </Button>
              </div>
            )}
          </div>
          <div className="EditorView__rightPanel grow">
            {typeof resource === "object" && <PropertiesPanel resource={resource} />}
          </div>
        </>
      )}
    </div>
  );
}
