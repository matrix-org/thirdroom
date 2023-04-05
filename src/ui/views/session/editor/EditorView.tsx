import { useEffect, useRef, useState } from "react";
import { TreeViewRefApi } from "@thirdroom/manifold-editor-components";
import { useAtom, useAtomValue } from "jotai";
import Editor, { OnChange } from "@monaco-editor/react";
import { BlobHandle, Room } from "@thirdroom/hydrogen-view-sdk";

import "./EditorView.css";
import { useEditor } from "../../../hooks/useEditor";
import { HierarchyPanel } from "./HierarchyPanel";
import { useMainThreadContext } from "../../../hooks/useMainThread";
import { getLocalResource, MainThreadResource } from "../../../../engine/resource/resource.main";
import { PropertiesPanel } from "./PropertiesPanel";
import { DEFAULT_SCRIPT_SOURCE, editorAtom, scriptSourceAtom, showCodeEditorAtom } from "../../../state/editor";
import { Button } from "../../../atoms/button/Button";
import { useHydrogen } from "../../../hooks/useHydrogen";
import { MAX_OBJECT_CAP } from "../../../../engine/config.common";
import { uploadAttachment } from "../../../utils/matrixUtils";
import { Dots } from "../../../atoms/loading/Dots";
import { useKeyDown } from "../../../hooks/useKeyDown";
import { useLocalStorage } from "../../../hooks/useLocalStorage";

export function EditorView({ room }: { room?: Room }) {
  const treeViewRef = useRef<TreeViewRefApi>(null);
  const { loading, scene, resources } = useEditor(treeViewRef);
  const activeEntity = useAtomValue(editorAtom).activeEntity;
  const { session, platform } = useHydrogen(true);
  const mainThread = useMainThreadContext();
  const resource = getLocalResource(mainThread, activeEntity) as unknown as MainThreadResource;
  const [scriptSource, setScriptSource] = useAtom(scriptSourceAtom);
  const [showCodeEditor, setShowCodeEditor] = useAtom(showCodeEditorAtom);
  const [maxObjectCap] = useState(MAX_OBJECT_CAP);
  const [localCode, setLocalCode] = useLocalStorage<string | undefined>(
    "feature_localCodeEditorState_worldId_" + room?.id || "gltfViewer",
    undefined
  );

  /**
   * Release pointer when editor view is rendered, re-lock it when editor view is disposed
   */
  useEffect(() => {
    document.exitPointerLock();

    return () => {
      mainThread.canvas?.requestPointerLock();
    };
  }, [mainThread]);

  /**
   * Set monaco editor text to locally stored code or default script source
   */
  useEffect(() => {
    setScriptSource(localCode || DEFAULT_SCRIPT_SOURCE);
  }, [localCode, setScriptSource]);

  /**
   * Load up the locally saved code, otherwise load the existing script
   */
  useEffect(() => {
    if (room) {
      (async () => {
        const stateEvent = await room.getStateEvent("org.matrix.msc3815.world");
        const content = stateEvent?.event.content;
        if (!content) return false;

        let scriptUrl = content.script_url;
        if (!scriptUrl) return;

        if (scriptUrl.startsWith("mxc:")) {
          scriptUrl = session.mediaRepository.mxcUrl(scriptUrl);
        }

        const res = await fetch(scriptUrl);
        const contentType = res.headers.get("content-type");
        if (contentType === "application/wasm") {
          return;
        }
        const text = await res.text();
        setScriptSource(text);
      })();
    }
  }, [session, room, setScriptSource, localCode]);

  const [reloading, setReloading] = useState(false);

  async function saveAndRunScript() {
    if (!room) {
      return;
    }

    const event = await room.getStateEvent("org.matrix.msc3815.world");
    const content = event?.event?.content;

    if (!content) return false;

    setReloading(true);

    const blobHandle = platform.createBlob(new ArrayBuffer(0), "text/javascript");
    // HACK: explicitly overwrite _blob (internally the mimeType is reset by platform.createBlob)
    // TODO: expose BlobHandle or override platform.createBlob to accept a regular blob and not overwrite its mimeType
    (blobHandle as BlobHandle)._blob = new File([scriptSource], "script.js", { type: "text/javascript" });

    const scriptMxc = await uploadAttachment(session.hsApi, blobHandle);

    session.hsApi.sendState(room.id, "org.matrix.msc3815.world", "", {
      max_member_object_cap: maxObjectCap,
      scene_url: content.scene_url,
      scene_preview_url: content.scene_preview_url,
      script_url: scriptMxc,
    });
  }

  useKeyDown(
    (e) => {
      if (e.shiftKey && e.code === "Backquote") {
        setShowCodeEditor((v) => !v);
      }
    },
    [setShowCodeEditor]
  );

  function handleEditorChange(value: string) {
    setScriptSource(value);
    setLocalCode(() => value);
  }

  return (
    <>
      {!loading && scene && (
        <>
          <div className="EditorView__leftPanel">
            <HierarchyPanel scene={scene} resources={resources} treeViewRef={treeViewRef} />
          </div>
          {typeof resource === "object" && (
            <div className="EditorView__rightPanel">
              <PropertiesPanel resource={resource} />
            </div>
          )}
          {showCodeEditor && (
            <div className="EditorView__code">
              <Editor
                defaultLanguage="javascript"
                defaultValue={scriptSource}
                onChange={handleEditorChange as OnChange}
              />
              <Button size="xxl" variant="primary" onClick={saveAndRunScript}>
                {!reloading ? (
                  "Save & Run"
                ) : (
                  <>
                    <Dots size="lg" color="on-primary" />
                  </>
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </>
  );
}
