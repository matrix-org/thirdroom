import { useEffect, useState } from "react";
import { useAtom, useSetAtom } from "jotai";
import { BlobHandle, Room } from "@thirdroom/hydrogen-view-sdk";
import Editor, { Monaco, OnChange } from "@monaco-editor/react";

import { Button } from "../../../atoms/button/Button";
import { Dots } from "../../../atoms/loading/Dots";
import { Text } from "../../../atoms/text/Text";
import { EditorHeader, EditorHeaderTab } from "../../components/editor-header/EditorHeader";
import { useHydrogen } from "../../../hooks/useHydrogen";
import { uploadAttachment } from "../../../utils/matrixUtils";
import { scriptSourceAtom, showCodeEditorAtom } from "../../../state/editor";
import { useLocalStorage } from "../../../hooks/useLocalStorage";
import { DEFAULT_SCRIPT_SOURCE } from "../../../state/editor";
import { AlertDialog } from "../dialogs/AlertDialog";
import "./ScriptEditor.css";
import { IconButton } from "../../../atoms/button/IconButton";
import DarkLightIC from "../../../../../res/ic/dark-light.svg";
import ArrowBackIC from "../../../../../res/ic/arrow-back.svg";
import { Tooltip } from "../../../atoms/tooltip/Tooltip";
import { Icon } from "../../../atoms/icon/Icon";
import websgTypes from "../../../../../packages/websg-types/types/websg.d.ts?raw";

const MONACO_THEME_KEY = "monaco_theme";

export function ScriptEditor({ room }: { room: Room }) {
  const { session, platform } = useHydrogen(true);
  // script sources
  const [activeScriptSource, setActiveScriptSource] = useAtom(scriptSourceAtom);
  const [persistedScriptSource, setPersistedScriptSource] = useState<string | undefined>(undefined);
  const [localScriptSource, setLocalScriptSource] = useLocalStorage<string | undefined>(
    "feature_localCodeEditorState_worldId_" + room?.id || "gltfViewer",
    undefined
  );

  // component state
  const [editorTheme, setEditorTheme] = useLocalStorage<"light" | "vs-dark">(MONACO_THEME_KEY, "light");
  const setShowCodeEditor = useSetAtom(showCodeEditorAtom);
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
      <div className="ScriptEditor flex flex-column">
        <EditorHeader className="ScriptEditor__header shrink-0 gap-sm">
          <div className="grow flex">
            <EditorHeaderTab active={false} onClick={() => setShowCodeEditor(false)}>
              <Icon size="sm" src={ArrowBackIC} />
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
            theme={editorTheme}
          />
          <div className="ScriptEditor__themeBtn">
            <Tooltip side="left" content="Toggle Editor Theme">
              <IconButton iconSrc={DarkLightIC} label="Toggle Editor Theme" onClick={handleToggleTheme} />
            </Tooltip>
          </div>
        </div>
      </div>
    </>
  );
}
