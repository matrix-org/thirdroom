import { useEffect, useRef, useState } from "react";
import { useAtom } from "jotai";
import { BlobHandle, Room } from "@thirdroom/hydrogen-view-sdk";
import Editor, { Monaco, OnChange, useMonaco } from "@monaco-editor/react";
import { editor as MonacoEditor } from "monaco-editor";
import { useDrop } from "react-dnd";

import { Button } from "../../../atoms/button/Button";
import { Dots } from "../../../atoms/loading/Dots";
import { Text } from "../../../atoms/text/Text";
import { EditorHeader, EditorHeaderTab } from "../../components/editor-header/EditorHeader";
import { useHydrogen } from "../../../hooks/useHydrogen";
import { uploadAttachment } from "../../../utils/matrixUtils";
import { scriptSourceAtom } from "../../../state/editor";
import { useLocalStorage } from "../../../hooks/useLocalStorage";
import { DEFAULT_SCRIPT_SOURCE } from "../../../state/editor";
import { AlertDialog } from "../dialogs/AlertDialog";
import "./ScriptEditor.css";
import { IconButton } from "../../../atoms/button/IconButton";
import DarkLightIC from "../../../../../res/ic/dark-light.svg";
import { Tooltip } from "../../../atoms/tooltip/Tooltip";
import websgTypes from "../../../../../packages/websg-types/types/websg.d.ts?raw";
import { DnDItemTypes, NodeDragItem } from "./HierarchyPanel";
import { MainThreadResource, getLocalResource } from "../../../../engine/resource/resource.main";
import { useMainThreadContext } from "../../../hooks/useMainThread";
import { camelizeVariableName } from "../../../utils/common";

const MONACO_THEME_KEY = "monaco_theme";

export function ScriptEditor({ room }: { room: Room }) {
  const { session, platform } = useHydrogen(true);
  const mainThread = useMainThreadContext();
  // script sources
  const [activeScriptSource, setActiveScriptSource] = useAtom(scriptSourceAtom);
  const [persistedScriptSource, setPersistedScriptSource] = useState<string | undefined>(undefined);
  const [localScriptSource, setLocalScriptSource] = useLocalStorage<string | undefined>(
    "feature_localCodeEditorState_worldId_" + room?.id || "gltfViewer",
    undefined
  );

  // component state
  const [editorTheme, setEditorTheme] = useLocalStorage<"light" | "vs-dark">(MONACO_THEME_KEY, "light");
  const [reloading, setReloading] = useState(false);
  const [saved, setSavedState] = useState(true);
  const [showResetModal, setShowResetModal] = useState(false);

  const monaco = useMonaco();
  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null);
  /**
   *  Set saved to true if active script is equal to persisted script
   */
  useEffect(() => {
    setSavedState(activeScriptSource === persistedScriptSource);
  }, [activeScriptSource, persistedScriptSource]);

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

  const [{ canDrop }, dropTarget] = useDrop(
    () => ({
      accept: DnDItemTypes.Node,
      drop(item: NodeDragItem) {
        const { activeNodeId } = item;
        if (!item) return;
        const resource = getLocalResource(mainThread, activeNodeId) as unknown as MainThreadResource;

        const editor = editorRef.current;
        if (!monaco || !editor) return;
        const line = editor.getPosition();
        if (!line) return;
        const range = new monaco.Range(line.lineNumber, line.column, line.lineNumber, line.column);
        const id = { major: 1, minor: 1 };
        const text = `const ${camelizeVariableName(resource.name)} = world.findNodeByName("${resource.name}");\n`;
        const edit = {
          identifier: id,
          range,
          text,
          forceMoveMarkers: true,
        };
        editor.executeEdits("my-source", [edit]);
      },
      collect: (monitor) => ({
        canDrop: monitor.canDrop(),
      }),
    }),
    [monaco]
  );

  async function saveAndRunScript() {
    if (!room) return;

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
      ...content,
      script_url: scriptMxc,
    });
  }

  const handleEditorChange: OnChange = (value) => {
    if (!value) return;
    setActiveScriptSource(value);
    setLocalScriptSource(() => value);
    setSavedState(value === persistedScriptSource);
  };

  function onShowResetModal() {
    setShowResetModal(true);
  }

  function resetScript() {
    if (persistedScriptSource) setActiveScriptSource(persistedScriptSource);
    setShowResetModal(false);
  }

  function handleToggleTheme() {
    setEditorTheme(editorTheme === "light" ? "vs-dark" : "light");
  }

  function configureMonaco(monaco: Monaco) {
    const options = monaco.languages.typescript.javascriptDefaults.getCompilerOptions();
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      ...options,
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      checkJs: true,
      strictNullChecks: false,
      lib: ["esnext"],
    });
    monaco.languages.typescript.javascriptDefaults.addExtraLib(websgTypes, "websg.d.ts");
  }

  return (
    <>
      <AlertDialog
        open={showResetModal}
        requestClose={() => setShowResetModal(false)}
        title="Reset Script"
        content={<Text variant="b2">Are you sure you want to reset the script? Any unsaved changes will be lost!</Text>}
        buttons={
          <div className="flex gap-xs">
            <Button className="basis-0 grow" variant="danger" fill="outline" onClick={() => setShowResetModal(false)}>
              Cancel
            </Button>
            <Button className="basis-0 grow" variant="danger" onClick={resetScript}>
              Reset
            </Button>
          </div>
        }
      />
      <div ref={dropTarget} className="ScriptEditor flex flex-column">
        <EditorHeader className="ScriptEditor__header shrink-0 gap-sm">
          <div className="grow flex">
            <EditorHeaderTab active={false}>
              <Text variant="b2" weight="semi-bold">
                Script Editor
              </Text>
            </EditorHeaderTab>
          </div>
          <div className="ScriptEditor__headerToolbar shrink-0 flex items-center">
            <Button size="xs" variant="danger" onClick={onShowResetModal} disabled={saved}>
              Reset
            </Button>
            <Button size="xs" variant="primary" onClick={saveAndRunScript} disabled={saved}>
              {reloading ? <Dots size="sm" color="on-primary" /> : "Save & Run"}
            </Button>
          </div>
        </EditorHeader>
        <div className="ScriptEditor__code grow">
          <Editor
            defaultLanguage="javascript"
            defaultValue={DEFAULT_SCRIPT_SOURCE}
            value={activeScriptSource}
            onChange={handleEditorChange as OnChange}
            beforeMount={configureMonaco}
            onMount={(editor) => (editorRef.current = editor)}
            theme={editorTheme}
          />
          <div className="ScriptEditor__themeBtn">
            <Tooltip side="left" content="Toggle Editor Theme">
              <IconButton iconSrc={DarkLightIC} label="Toggle Editor Theme" onClick={handleToggleTheme} />
            </Tooltip>
          </div>
          {canDrop && (
            <div className="ScriptEditor__dropOverlay flex flex-column items-center justify-center">
              <div className="ScriptEditor__dropContainer flex flex-column items-center gap-xs">
                <Text variant="s1" color="world" weight="bold" className="text-center">
                  Drop Node
                </Text>
                <Text color="world" weight="medium" className="text-center">
                  Insert code at your cursor to access node in script
                </Text>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
