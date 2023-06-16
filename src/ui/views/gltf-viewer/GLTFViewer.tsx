import { DragEvent, useCallback, useContext, useEffect, useRef, useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useSearchParams } from "react-router-dom";

import { registerMessageHandler, Thread } from "../../../engine/module/module.common";
import { createDisposables } from "../../../engine/utils/createDisposables";
import {
  GLTFViewerLoadedMessage,
  GLTFViewerLoadErrorMessage,
  ThirdRoomMessageType,
} from "../../../plugins/thirdroom/thirdroom.common";
import { useKeyDown } from "../../hooks/useKeyDown";
import { MainThreadContextProvider, useInitMainThreadContext, useMainThreadContext } from "../../hooks/useMainThread";
import { EditorView } from "../session/editor/EditorView";
import { Stats } from "../session/stats/Stats";
import { Text } from "../../atoms/text/Text";
import "./GLTFViewer.css";
import { HydrogenContext } from "../../hooks/useHydrogen";
import { EntityTooltip } from "../session/entity-tooltip/EntityTooltip";
import { InteractableAction } from "../../../plugins/interaction/interaction.common";
import { InteractableType } from "../../../engine/resource/schema";
import { Reticle } from "../session/reticle/Reticle";
import { InteractionState, useWorldInteraction } from "../../hooks/useWorldInteraction";
import { getMxIdUsername } from "../../utils/matrixUtils";

export default function GLTFViewer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mainThread = useInitMainThreadContext(canvasRef);
  const [{ loading, loaded, error }, setLoadState] = useState<{ loading: boolean; loaded: boolean; error?: string }>({
    loading: false,
    loaded: false,
  });

  const { session } = useContext(HydrogenContext) || {};

  const [params] = useSearchParams();

  useEffect(() => {
    const mxcUrl = params.get("url");

    if (!mxcUrl) {
      return;
    }

    if (!session) {
      setLoadState({ loading: false, loaded: false, error: "Not signed in" });
      return;
    }

    const sceneUrl = session.mediaRepository.mxcUrl(mxcUrl);

    if (!sceneUrl) {
      setLoadState({ loading: false, loaded: false, error: "Invalid scene url" });
      return;
    }

    const loadScene = async () => {
      const response = await fetch(sceneUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      if (mainThread && url) {
        setLoadState({ loading: true, loaded: false });

        mainThread.sendMessage(Thread.Game, {
          type: ThirdRoomMessageType.GLTFViewerLoadGLTF,
          url,
          fileMap: new Map(),
        });
      }
    };

    loadScene().catch((error) => {
      setLoadState({ loading: false, loaded: true, error: error.message });
    });
  }, [mainThread, session, params]);

  useEffect(() => {
    if (mainThread) {
      return createDisposables([
        registerMessageHandler(
          mainThread,
          ThirdRoomMessageType.GLTFViewerLoaded,
          (ctx, message: GLTFViewerLoadedMessage) => setLoadState({ loading: false, loaded: true })
        ),
        registerMessageHandler(
          mainThread,
          ThirdRoomMessageType.GLTFViewerLoadError,
          (ctx, message: GLTFViewerLoadErrorMessage) =>
            setLoadState({ loading: false, loaded: true, error: message.error })
        ),
      ]);
    }
  }, [mainThread]);

  const onClickCanvas = useCallback(() => {
    if (canvasRef.current) {
      canvasRef.current.requestPointerLock();
    }
  }, []);

  const onDropFile = useCallback(
    (e: DragEvent<HTMLCanvasElement>) => {
      e.preventDefault();

      if (!e.dataTransfer) {
        return;
      }

      let url: string | undefined = undefined;
      let scriptUrl: string | undefined = undefined;
      const fileMap: Map<string, string> = new Map();

      for (const item of e.dataTransfer.items) {
        const file = item.getAsFile();

        if (file) {
          const fileUrl = URL.createObjectURL(file);

          if (file.name.match(/\.gl(?:tf|b)$/)) {
            url = fileUrl;
          } else if (file.name.match(/\.(js|wasm)$/)) {
            scriptUrl = fileUrl;
          } else {
            fileMap.set(encodeURIComponent(file.name), fileUrl);
          }
        }
      }

      if (mainThread && url) {
        setLoadState({ loading: true, loaded: false });

        mainThread.sendMessage(Thread.Game, {
          type: ThirdRoomMessageType.GLTFViewerLoadGLTF,
          url,
          scriptUrl,
          fileMap,
        });
      }
    },
    [mainThread]
  );

  const onDragOver = useCallback((e: DragEvent<HTMLCanvasElement>) => {
    e.preventDefault();
  }, []);

  return (
    <DndProvider backend={HTML5Backend}>
      <MainThreadContextProvider value={mainThread}>
        <div className="GLTFViewer">
          <canvas
            className="GLTFViewer__viewport"
            ref={canvasRef}
            onClick={onClickCanvas}
            onDrop={onDropFile}
            onDragOver={onDragOver}
          />
          {mainThread && loaded && <GLTFViewerUI />}
          {!loaded && !loading && !error && (
            <div className="GLTFViewer__message">
              <Text color="world">Drag and drop .gltf directory or .glb file to preview it.</Text>
            </div>
          )}
          {!loaded && loading && (
            <div className="GLTFViewer__message">
              <Text color="world">Loading scene...</Text>
            </div>
          )}
          {error && (
            <div className="GLTFViewer__message">
              <Text color="danger">{error}</Text>
            </div>
          )}
        </div>
      </MainThreadContextProvider>
    </DndProvider>
  );
}

function GLTFViewerUI() {
  const mainThread = useMainThreadContext();
  const [editorEnabled, setEditorEnabled] = useState(false);
  const [statsEnabled, setStatsEnabled] = useState(false);
  const [activeEntity, setActiveEntity] = useState<InteractionState | undefined>();

  useKeyDown((e) => {
    if (e.code === "Backquote") {
      setEditorEnabled((enabled) => !enabled);
    }
    if (e.code === "KeyS" && e.shiftKey && e.ctrlKey) {
      setStatsEnabled((enabled) => !enabled);
    }
  }, []);

  const handleInteraction = useCallback(
    (interaction?: InteractionState) => {
      if (!interaction) return setActiveEntity(undefined);
      const { interactableType, action, peerId } = interaction;

      if (action === InteractableAction.Grab) {
        if (interactableType === InteractableType.Player && typeof peerId === "string") {
          console.log("Interacted with player", interaction);
          document.exitPointerLock();
          return;
        }
        if (interactableType === InteractableType.Portal) {
          console.log("Interacted with portal", interaction);
          return;
        }
        if (interactableType === InteractableType.Screenshare) {
          console.log("Interacted with screenshare", interaction);
          return;
        }
      }

      if (interactableType === InteractableType.Player) {
        const entity: InteractionState = {
          ...interaction,
          name: peerId ? getMxIdUsername(peerId) : "Player",
        };
        setActiveEntity(entity);
      }

      setActiveEntity(interaction);
    },
    [setActiveEntity]
  );

  useWorldInteraction(mainThread, handleInteraction);

  return (
    <>
      <Stats statsEnabled={statsEnabled} />
      {editorEnabled && <EditorView />}
      {activeEntity && <EntityTooltip activeEntity={activeEntity} interactionProcess={{ loading: false }} />}
      <Reticle />
    </>
  );
}
