import { DragEvent, useCallback, useRef, useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

import { Thread } from "../../../engine/module/module.common";
import { useKeyDown } from "../../hooks/useKeyDown";
import { MainThreadContextProvider, useInitMainThreadContext } from "../../hooks/useMainThread";
import { EditorView } from "../session/editor/EditorView";
import { Stats } from "../session/stats/Stats";
import "./GLTFViewer.css";

export function GLTFViewer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mainThread = useInitMainThreadContext(canvasRef);
  const [editorEnabled, setEditorEnabled] = useState(false);
  const [statsEnabled, setStatsEnabled] = useState(false);

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
        mainThread.sendMessage(Thread.Game, {
          type: "gltf-viewer-load-gltf",
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
        </div>
      </MainThreadContextProvider>
    </DndProvider>
  );
}
