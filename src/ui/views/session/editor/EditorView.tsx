import { useEffect, useRef, useState } from "react";
import { TreeViewRefApi } from "@thirdroom/manifold-editor-components";
import { useAtomValue } from "jotai";
import Editor, { OnChange } from "@monaco-editor/react";
import { Room } from "@thirdroom/hydrogen-view-sdk";

import "./EditorView.css";
import { useEditor } from "../../../hooks/useEditor";
import { HierarchyPanel } from "./HierarchyPanel";
import { useMainThreadContext } from "../../../hooks/useMainThread";
import { getLocalResource, MainThreadResource } from "../../../../engine/resource/resource.main";
import { PropertiesPanel } from "./PropertiesPanel";
import { editorAtom } from "../../../state/editor";
import { Button } from "../../../atoms/button/Button";
import { useHydrogen } from "../../../hooks/useHydrogen";
import { MAX_OBJECT_CAP } from "../../../../engine/config.common";
import { uploadAttachment } from "../../../utils/matrixUtils";

const DEFAULT_EDITOR_TEXT = `


onload = () => {

};

onenter = () => {
  
};

onupdate = (dt) => {
  
};
`;

export const saveTextAsFile = (text: string, fileName: string): void => {
  const blob = new Blob([text], { type: "text/plain" });
  const downloadLink = document.createElement("a");
  downloadLink.download = fileName;
  downloadLink.innerHTML = "Download File";
  if (window.webkitURL) {
    // No need to add the download element to the DOM in Webkit.
    downloadLink.href = window.webkitURL.createObjectURL(blob);
  } else {
    downloadLink.href = window.URL.createObjectURL(blob);
    downloadLink.onclick = (event: MouseEvent): void => {
      if (event.target) {
        document.body.removeChild(event.target as Node);
      }
    };
    downloadLink.style.display = "none";
    document.body.appendChild(downloadLink);
  }

  downloadLink.click();

  if (window.webkitURL) {
    window.webkitURL.revokeObjectURL(downloadLink.href);
  } else {
    window.URL.revokeObjectURL(downloadLink.href);
  }
};

export function EditorView({ room }: { room: Room }) {
  const treeViewRef = useRef<TreeViewRefApi>(null);
  const { loading, scene, resources } = useEditor(treeViewRef);
  const activeEntity = useAtomValue(editorAtom).activeEntity;
  const { session, platform } = useHydrogen(true);

  const mainThread = useMainThreadContext();
  const resource = getLocalResource(mainThread, activeEntity) as unknown as MainThreadResource;

  const [editorText, setEditorText] = useState(DEFAULT_EDITOR_TEXT);

  // const maxObjectCapRef = useRef(MAX_OBJECT_CAP);
  const [maxObjectCap] = useState(MAX_OBJECT_CAP);

  /**
   * Load the existing script if one exists
   */
  useEffect(() => {
    room?.getStateEvent("org.matrix.msc3815.world").then((stateEvent) => {
      const content = stateEvent?.event.content;
      if (!content) return false;

      let scriptUrl = content.script_url;
      if (!scriptUrl) return;

      if (scriptUrl.startsWith("mxc:")) {
        scriptUrl = session.mediaRepository.mxcUrl(scriptUrl);
      }

      fetch(scriptUrl).then((res) => {
        const contentType = res.headers.get("content-type");
        if (contentType === "application/wasm") {
          return;
        }
        res.text().then(setEditorText);
      });
    });
  }, [session, room, loading]);

  async function saveAndRunScript() {
    const event = await room?.getStateEvent("org.matrix.msc3815.world");
    const content = event?.event?.content;

    if (!content) return false;

    const file = new File([editorText], "script.js", { type: "text/javascript" });
    const blobHandle = platform.createBlob(await file.arrayBuffer(), "text/javascript");
    // HACK: explicitly overwrite blob, internally the mimeType is reset.
    // TODO: expose BlobHandle or override platform.createBlob to accept a regular blob and not overwrite its mimeType
    (blobHandle as any)._blob = file;

    const scriptMxc = await uploadAttachment(session.hsApi, blobHandle);

    session.hsApi.sendState(room.id, "org.matrix.msc3815.world", "", {
      max_member_object_cap: maxObjectCap,
      scene_url: content.scene_url,
      scene_preview_url: content.scene_preview_url,
      script_url: scriptMxc,
    });
  }

  function handleEditorChange(value: string) {
    setEditorText(value);
  }

  return (
    <>
      {loading || !scene ? null : (
        <>
          <div className="EditorView__textEditor">
            <Editor
              height="100%"
              defaultLanguage="javascript"
              defaultValue={editorText}
              onChange={handleEditorChange as OnChange}
            />
            <Button size="xxl" variant="primary" onClick={saveAndRunScript}>
              Save & Run
            </Button>
          </div>
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
