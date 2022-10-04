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
import { MainThreadContextProvider, useInitMainThreadContext } from "../../hooks/useMainThread";
import { EditorView } from "../session/editor/EditorView";
import { Stats } from "../session/stats/Stats";
import { Text } from "../../atoms/text/Text";
import "./GLTFViewer.css";

export default function GLTFViewer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mainThread = useInitMainThreadContext(canvasRef);
  const [editorEnabled, setEditorEnabled] = useState(false);
  const [statsEnabled, setStatsEnabled] = useState(false);
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

  useKeyDown((e) => {
    if (e.code === "Backquote") {
      setEditorEnabled((enabled) => !enabled);
    }
    if (e.code === "KeyS" && e.shiftKey && e.ctrlKey) {
      setStatsEnabled((enabled) => !enabled);
    }
  }, []);

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
      const fileMap: Map<string, string> = new Map();

      for (const item of e.dataTransfer.items) {
        const file = item.getAsFile();

        if (file) {
          const fileUrl = URL.createObjectURL(file);

          if (file.name.match(/\.gl(?:tf|b)$/)) {
            url = fileUrl;
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
          {mainThread && <Stats statsEnabled={statsEnabled} />}
          {mainThread && editorEnabled && <EditorView />}
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
