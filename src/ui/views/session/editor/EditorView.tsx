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
import CrossIC from "../../../../../res/ic/cross.svg";
import { Text } from "../../../atoms/text/Text";
import { Dialog } from "../../../atoms/dialog/Dialog";
import { Header } from "../../../atoms/header/Header";
import { HeaderTitle } from "../../../atoms/header/HeaderTitle";
import { IconButton } from "../../../atoms/button/IconButton";

export function EditorView({ room }: { room?: Room }) {
  // dependencies
  const treeViewRef = useRef<TreeViewRefApi>(null);
  const { loading, scene, resources } = useEditor(treeViewRef);
  const activeEntity = useAtomValue(editorAtom).activeEntity;
  const { session, platform } = useHydrogen(true);
  const mainThread = useMainThreadContext();
  const resource = getLocalResource(mainThread, activeEntity) as unknown as MainThreadResource;

  // script sources
  const [activeScriptSource, setActiveScriptSource] = useAtom(scriptSourceAtom);
  const [persistedScriptSource, setPersistedScriptSource] = useState<string | undefined>(undefined);
  const [localScriptSource, setLocalScriptSource] = useLocalStorage<string | undefined>(
    "feature_localCodeEditorState_worldId_" + room?.id || "gltfViewer",
    undefined
  );

  // component state
  const [maxObjectCap] = useState(MAX_OBJECT_CAP);
  const [showCodeEditor, setShowCodeEditor] = useAtom(showCodeEditorAtom);
  const [reloading, setReloading] = useState(false);
  const [saved, setSavedState] = useState(true);
  const [showResetModal, setShowResetModal] = useState(false);

  /**
   *  Set saved to true if active script is equal to persisted script
   */
  useEffect(() => {
    setSavedState(activeScriptSource === persistedScriptSource);
  }, [activeScriptSource, persistedScriptSource]);

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
    setActiveScriptSource(localScriptSource || DEFAULT_SCRIPT_SOURCE);
  }, [localScriptSource, setActiveScriptSource]);

  /**
   * Load up the persisted script if we don't have a locally modified script
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
        if (!localScriptSource) setActiveScriptSource(text);
        setPersistedScriptSource(text);
      })();
    }
  }, [session, room, setActiveScriptSource, localScriptSource]);

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
    (blobHandle as BlobHandle)._blob = new File([activeScriptSource], "script.js", { type: "text/javascript" });

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
    setActiveScriptSource(value);
    setLocalScriptSource(() => value);
    setSavedState(value === persistedScriptSource);
  }

  function onShowResetModal() {
    setShowResetModal(true);
  }

  function resetScript() {
    if (persistedScriptSource) setActiveScriptSource(persistedScriptSource);
    setShowResetModal(false);
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

          <Dialog className="EditorView__resetScriptDialog" open={showResetModal}>
            <div className="flex flex-column">
              <Header
                className="shrink-0"
                left={<HeaderTitle size="lg">Confirm Reset</HeaderTitle>}
                right={<IconButton iconSrc={CrossIC} onClick={() => setShowResetModal(false)} label="Close" />}
              />
              <div className="grow flex flex-column gap-lg" style={{ padding: "var(--sp-md)" }}>
                <div className="flex flex-column gap-sm">
                  <Text>Are you sure you want to reset the script? Any unsaved changes will be lost!</Text>
                  <div className="EditorView__resetScriptDialog_buttons">
                    <Button size="md" onClick={resetScript}>
                      Yes
                    </Button>
                    <Button size="md" onClick={() => setShowResetModal(false)}>
                      No
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Dialog>
          {showCodeEditor && (
            <div className="EditorView__code">
              <Editor
                defaultLanguage="javascript"
                defaultValue={DEFAULT_SCRIPT_SOURCE}
                value={activeScriptSource}
                onChange={handleEditorChange as OnChange}
              />
              <div className="EditorView__buttons">
                <Button size="xxl" variant="primary" onClick={saveAndRunScript} disabled={saved}>
                  {!reloading ? (
                    "Save & Run"
                  ) : (
                    <>
                      <Dots size="lg" color="on-primary" />
                    </>
                  )}
                </Button>
                <Button size="xxl" variant="danger" onClick={onShowResetModal} disabled={saved}>
                  Reset
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
