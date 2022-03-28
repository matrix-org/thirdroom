import GameWorker from "./GameWorker?worker";
import { createInputManager } from "./input/InputManager";
import { TripleBufferState } from "./TripleBuffer";
import {
  GameWorkerMessageTarget,
  RenderWorkerMessageTarget,
  WorkerMessageType,
} from "./WorkerMessage";

export async function initRenderWorker(
  canvas: HTMLCanvasElement,
  inputTripleBuffer: TripleBufferState,
  gameWorker: Worker
) {
  const supportsOffscreenCanvas = !!window.OffscreenCanvas;

  let renderWorker: Worker | typeof import("./RenderWorker");
  let canvasTarget: HTMLCanvasElement | OffscreenCanvas;
  let renderWorkerMessageTarget: RenderWorkerMessageTarget;
  let gameWorkerMessageTarget: GameWorkerMessageTarget;

  if (supportsOffscreenCanvas) {
    console.info("Browser supports OffscreenCanvas, rendering in WebWorker.");
    const { default: RenderWorker } = await import("./RenderWorker?worker");
    renderWorker = new RenderWorker();
    canvasTarget = canvas.transferControlToOffscreen();
    const interWorkerChannel = new MessageChannel();
    renderWorkerMessageTarget = interWorkerChannel.port1;
    gameWorkerMessageTarget = interWorkerChannel.port2;
  } else {
    console.info(
      "Browser does not support OffscreenCanvas, rendering on main thread."
    );
    renderWorker = await import("./RenderWorker");
    canvasTarget = canvas;
    renderWorkerMessageTarget = renderWorker;
    gameWorkerMessageTarget = gameWorker;
  }

  gameWorkerMessageTarget.postMessage(
    {
      type: WorkerMessageType.InitializeGameWorker,
      inputTripleBuffer,
      renderWorkerMessageTarget,
    },
    renderWorkerMessageTarget instanceof MessagePort
      ? [renderWorkerMessageTarget]
      : undefined
  );

  renderWorkerMessageTarget.postMessage(
    {
      type: WorkerMessageType.InitializeRenderWorker,
      gameWorkerMessageTarget,
      canvasTarget,
      canvasWidth: canvas.clientWidth,
      canvasHeight: canvas.clientHeight,
    },
    gameWorkerMessageTarget instanceof MessagePort &&
      canvasTarget instanceof OffscreenCanvas
      ? [gameWorkerMessageTarget, canvasTarget]
      : undefined
  );

  function onResize() {
    renderWorkerMessageTarget.postMessage({
      type: WorkerMessageType.RenderWorkerResize,
      canvasWidth: canvas.clientWidth,
      canvasHeight: canvas.clientHeight,
    });
  }

  window.addEventListener("resize", onResize);

  return {
    dispose() {
      window.removeEventListener("resize", onResize);

      if (renderWorker instanceof Worker) {
        renderWorker.terminate();
      }
    },
  };
}

export async function initMainThread(canvas: HTMLCanvasElement) {
  const inputManager = createInputManager(canvas);
  const gameWorker = new GameWorker();
  const renderWorker = await initRenderWorker(
    canvas,
    inputManager.tripleBuffer,
    gameWorker
  );

  let animationFrameId: number;

  function update() {
    inputManager.update();

    animationFrameId = requestAnimationFrame(update);
  }

  update();

  return {
    dispose() {
      cancelAnimationFrame(animationFrameId);
      inputManager.dispose();
      gameWorker.terminate();
      renderWorker.dispose();
    },
  };
}
