import GameWorker from "./GameWorker?worker";
import { createInputManager } from "./input/InputManager";
import { createResourceManagerBuffer } from "./resources/ResourceManager";
import { createTripleBuffer } from "./TripleBuffer";
import {
  GameWorkerMessageTarget,
  RenderWorkerMessageTarget,
  WorkerMessageType,
} from "./WorkerMessage";

export async function initRenderWorker(
  canvas: HTMLCanvasElement,
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
    renderWorkerMessageTarget = await import("./RenderWorker") as RenderWorkerMessageTarget;
    gameWorkerMessageTarget = gameWorker;
    canvasTarget = canvas;
  }

  function onResize() {
    renderWorkerMessageTarget.postMessage({
      type: WorkerMessageType.RenderWorkerResize,
      canvasWidth: canvas.clientWidth,
      canvasHeight: canvas.clientHeight,
    });
  }

  window.addEventListener("resize", onResize);

  return {
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

export async function initMainThread(canvas: HTMLCanvasElement) {
  const inputManager = createInputManager(canvas);
  const gameWorker = new GameWorker();
  const {
    canvasTarget,
    renderWorkerMessageTarget,
    gameWorkerMessageTarget,
    dispose: disposeRenderWorker,
  } = await initRenderWorker(canvas, gameWorker);

  const renderableTripleBuffer = createTripleBuffer();

  const resourceManagerBuffer = createResourceManagerBuffer();

  const renderWorkerMessagePort =
    renderWorkerMessageTarget instanceof MessagePort
      ? renderWorkerMessageTarget
      : undefined;

  gameWorkerMessageTarget.postMessage(
    {
      type: WorkerMessageType.InitializeGameWorker,
      renderableTripleBuffer,
      inputTripleBuffer: inputManager.tripleBuffer,
      renderWorkerMessagePort,
      resourceManagerBuffer,
    },
    renderWorkerMessagePort ? [renderWorkerMessagePort] : undefined
  );

  renderWorkerMessageTarget.postMessage(
    {
      type: WorkerMessageType.InitializeRenderWorker,
      renderableTripleBuffer,
      gameWorkerMessageTarget,
      canvasTarget,
      initialCanvasWidth: canvas.clientWidth,
      initialCanvasHeight: canvas.clientHeight,
      resourceManagerBuffer,
    },
    gameWorkerMessageTarget instanceof MessagePort &&
      canvasTarget instanceof OffscreenCanvas
      ? [gameWorkerMessageTarget, canvasTarget]
      : undefined
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
      disposeRenderWorker();
    },
  };
}
