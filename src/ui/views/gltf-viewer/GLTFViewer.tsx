import { DragEvent, useCallback, useEffect, useRef, useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

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
import { EntityTooltip } from "../session/entity-tooltip/EntityTooltip";
import { ActiveEntityState } from "../session/world/WorldView";
import {
  InteractableAction,
  InteractionMessage,
  InteractionMessageType,
} from "../../../plugins/interaction/interaction.common";
import { IMainThreadContext } from "../../../engine/MainThread";
import { InteractableType } from "../../../engine/resource/schema";
import { Reticle } from "../session/reticle/Reticle";
import { useMouseDown } from "../../hooks/useMouseDown";

export default function GLTFViewer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mainThread = useInitMainThreadContext(canvasRef);
  const [{ loading, loaded, error }, setLoadState] = useState<{ loading: boolean; loaded: boolean; error?: string }>({
    loading: false,
    loaded: false,
  });

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
            fileMap.set(file.name, fileUrl);
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
  const [activeEntity, setActiveEntity] = useState<ActiveEntityState | undefined>();
  const mouseDown = useMouseDown(mainThread.canvas);

  useKeyDown((e) => {
    if (e.code === "Backquote") {
      setEditorEnabled((enabled) => !enabled);
    }
    if (e.code === "KeyS" && e.shiftKey && e.ctrlKey) {
      setStatsEnabled((enabled) => !enabled);
    }
  }, []);

  useEffect(() => {
    const onInteraction = async (ctx: IMainThreadContext, message: InteractionMessage) => {
      const interactableType = message.interactableType;

      if (!interactableType || message.action === InteractableAction.Unfocus) {
        setActiveEntity(undefined);
      } else if (
        message.interactableType === InteractableType.Grabbable ||
        message.interactableType === InteractableType.Interactable
      ) {
        setActiveEntity({
          interactableType,
          name: message.name || "Object",
          held: message.held || false,
          ownerId: message.ownerId,
        });
      } else if (message.interactableType === InteractableType.Player) {
        if (message.action === InteractableAction.Grab) {
          console.log("Interacted with player", message);
        } else {
          setActiveEntity({
            interactableType,
            name: message.peerId || "Player",
            peerId: message.peerId,
            held: false,
          });
        }
      } else if (message.interactableType === InteractableType.Portal) {
        if (message.action === InteractableAction.Grab) {
          console.log("Interacted with portal", message);
        } else {
          setActiveEntity({
            interactableType,
            name: message.uri || "Portal",
            held: false,
          });
        }
      }
    };

    return registerMessageHandler(mainThread, InteractionMessageType, onInteraction);
  }, [mainThread]);

  return (
    <>
      <Stats statsEnabled={statsEnabled} />
      {editorEnabled && <EditorView />}
      {activeEntity && <EntityTooltip activeEntity={activeEntity} portalProcess={{ joining: false }} />}
      <Reticle activeEntity={activeEntity} mouseDown={mouseDown} />
    </>
  );
}
