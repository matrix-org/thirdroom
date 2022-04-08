import GameWorker from "./GameWorker?worker";
import { createInputManager } from "./input/InputManager";
import { createResourceManagerBuffer } from "./resources/ResourceManager";
import { createStatsBuffer, getStats, StatsObject } from "./stats";
import { createTripleBuffer } from "./TripleBuffer";
import {
  GameWorkerInitializedMessage,
  RenderWorkerInitializedMessage,
  WorkerMessages,
  WorkerMessageType,
  PostMessageTarget,
} from "./WorkerMessage";

export async function initRenderWorker(canvas: HTMLCanvasElement, gameWorker: Worker) {
  const supportsOffscreenCanvas = !!window.OffscreenCanvas;

  let renderWorker: Worker;
  let canvasTarget: HTMLCanvasElement | OffscreenCanvas;
  let renderWorkerMessageTarget: PostMessageTarget;
  let gameWorkerMessageTarget: PostMessageTarget;

  if (supportsOffscreenCanvas) {
    console.info("Browser supports OffscreenCanvas, rendering in WebWorker.");
    const { default: RenderWorker } = await import("./RenderWorker?worker");
    renderWorker = new RenderWorker();
    canvasTarget = canvas.transferControlToOffscreen();
    const interWorkerChannel = new MessageChannel();
    renderWorkerMessageTarget = interWorkerChannel.port1;
    gameWorkerMessageTarget = interWorkerChannel.port2;
  } else {
    console.info("Browser does not support OffscreenCanvas, rendering on main thread.");
    const result = await import("./RenderWorker");
    renderWorker = result.default as Worker;
    renderWorkerMessageTarget = result.default;
    gameWorkerMessageTarget = gameWorker;
    canvasTarget = canvas;
  }

  function onResize() {
    renderWorker.postMessage({
      type: WorkerMessageType.RenderWorkerResize,
      canvasWidth: canvas.clientWidth,
      canvasHeight: canvas.clientHeight,
    });
  }

  window.addEventListener("resize", onResize);

  return {
    renderWorker,
    canvasTarget,
    renderWorkerMessageTarget,
    gameWorkerMessageTarget,
    dispose() {
      window.removeEventListener("resize", onResize);

      if (renderWorker instanceof Worker) {
        renderWorker.terminate();
      }
    },
  };
}

export interface MainThread {
  dispose(): void;
  getStats(): StatsObject;
}

export async function initMainThread(canvas: HTMLCanvasElement): Promise<MainThread> {
  const inputManager = createInputManager(canvas);
  const gameWorker = new GameWorker();
  const {
    renderWorker,
    canvasTarget,
    renderWorkerMessageTarget,
    gameWorkerMessageTarget,
    dispose: disposeRenderWorker,
  } = await initRenderWorker(canvas, gameWorker);

  const renderableTripleBuffer = createTripleBuffer();

  const resourceManagerBuffer = createResourceManagerBuffer();

  const renderWorkerMessagePort =
    renderWorkerMessageTarget instanceof MessagePort ? renderWorkerMessageTarget : undefined;

  const statsBuffer = createStatsBuffer();

  await new Promise<RenderWorkerInitializedMessage>((resolve, reject) => {
    renderWorker.postMessage(
      {
        type: WorkerMessageType.InitializeRenderWorker,
        renderableTripleBuffer,
        gameWorkerMessageTarget,
        canvasTarget,
        initialCanvasWidth: canvas.clientWidth,
        initialCanvasHeight: canvas.clientHeight,
        resourceManagerBuffer,
        statsSharedArrayBuffer: statsBuffer.buffer,
      },
      gameWorkerMessageTarget instanceof MessagePort && canvasTarget instanceof OffscreenCanvas
        ? [gameWorkerMessageTarget, canvasTarget]
        : undefined
    );

    const onMessage = ({ data }: any): void => {
      if (data.type === WorkerMessageType.RenderWorkerInitialized) {
        resolve(data);
        renderWorker.removeEventListener("message", onMessage);
      } else if (data.type === WorkerMessageType.RenderWorkerError) {
        reject(data.error);
        renderWorker.removeEventListener("message", onMessage);
      }
    };

    renderWorker.addEventListener("message", onMessage);
  });

  await new Promise<GameWorkerInitializedMessage>((resolve, reject) => {
    gameWorker.postMessage(
      {
        type: WorkerMessageType.InitializeGameWorker,
        renderableTripleBuffer,
        inputTripleBuffer: inputManager.tripleBuffer,
        renderWorkerMessagePort,
        resourceManagerBuffer,
        statsSharedArrayBuffer: statsBuffer.buffer,
      },
      renderWorkerMessagePort ? [renderWorkerMessagePort] : undefined
    );

    const onMessage = ({ data }: { data: WorkerMessages }): void => {
      if (data.type === WorkerMessageType.GameWorkerInitialized) {
        resolve(data);
        gameWorker.removeEventListener("message", onMessage);
      } else if (data.type === WorkerMessageType.GameWorkerError) {
        reject(data.error);
        gameWorker.removeEventListener("message", onMessage);
      }
    };

    gameWorker.addEventListener("message", onMessage);
  });

  renderWorker.postMessage({
    type: WorkerMessageType.StartRenderWorker,
  });

  gameWorker.postMessage({
    type: WorkerMessageType.StartGameWorker,
  });

  const onRenderWorkerMessage = ({ data }: MessageEvent) => {
    if (typeof data !== "object") {
      return;
    }

    const message = data as WorkerMessages;

    switch (message.type) {
      case WorkerMessageType.SaveGLTF:
        downloadFile(message.buffer, "scene.glb");
    }
  };

  renderWorker.addEventListener("message", onRenderWorkerMessage);

  let animationFrameId: number;

  function update() {
    inputManager.update();

    animationFrameId = requestAnimationFrame(update);
  }

  update();

  return {
    getStats() {
      return getStats(statsBuffer);
    },
    dispose() {
      cancelAnimationFrame(animationFrameId);
      inputManager.dispose();
      gameWorker.terminate();
      disposeRenderWorker();
    },
  };
}

function downloadFile(buffer: ArrayBuffer, fileName: string) {
  const blob = new Blob([buffer], { type: "application/octet-stream" });
  const el = document.createElement("a");
  el.style.display = "none";
  document.body.appendChild(el);
  el.href = URL.createObjectURL(blob);
  el.download = fileName;
  el.click();
  document.body.removeChild(el);
}
