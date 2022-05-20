import EventEmitter from "events";

import GameWorker from "./GameWorker?worker";
import input, { MainThreadInputState } from "./input/input.main";
import { createResourceManagerBuffer } from "./resources/ResourceManager";
import stats, { MainThreadStatsState } from "./stats/stats.main";
import audio, { MainThreadAudioState } from "./audio/audio.main";
import network, { MainThreadNetworkState } from "./network/network.main";
import { createTripleBuffer } from "./TripleBuffer";
import {
  GameWorkerInitializedMessage,
  RenderWorkerInitializedMessage,
  WorkerMessages,
  WorkerMessageType,
  PostMessageTarget,
  InitializeGameWorkerMessage,
  InitializeRenderWorkerMessage,
} from "./WorkerMessage";
import editor, { MainThreadEditorState } from "./editor/editor.main";

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
    const result = await import("./RenderThread");
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

export type MainThreadSystem = (state: MainThreadState) => void;

export interface MainThreadState extends EventEmitter {
  canvas: HTMLCanvasElement;
  animationFrameId?: number;
  gameWorker: Worker;
  editor: MainThreadEditorState;
  systems: MainThreadSystem[];
  network: MainThreadNetworkState;
  stats: MainThreadStatsState;
  audio: MainThreadAudioState;
  input: MainThreadInputState;
  disposeRenderWorker: () => void;
}

export async function initEngine(canvas: HTMLCanvasElement): Promise<MainThreadState> {
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

  const state: MainThreadState = Object.assign(
    {
      canvas,
      gameWorker,
      editor: editor.create(),
      network: network.create(),
      stats: stats.create(),
      audio: audio.create(),
      input: input.create(),
      systems: [],
      disposeRenderWorker,
    },
    new EventEmitter()
  );

  /* Wait for workers to be ready */

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
        statsBuffer: state.stats.buffer,
      } as InitializeRenderWorkerMessage,
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
        inputTripleBuffer: state.input.tripleBuffer,
        audioTripleBuffer: state.audio.tripleBuffer,
        renderWorkerMessagePort,
        resourceManagerBuffer,
        statsBuffer: state.stats.buffer,
        hierarchyTripleBuffer: state.editor.hierarchyTripleBuffer,
      } as InitializeGameWorkerMessage,
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

  /* Start Workers */

  renderWorker.postMessage({
    type: WorkerMessageType.StartRenderWorker,
  });

  gameWorker.postMessage({
    type: WorkerMessageType.StartGameWorker,
  });

  /* Render Worker Messages */

  const onRenderWorkerMessage = ({ data }: MessageEvent) => {
    if (typeof data !== "object") {
      return;
    }

    const message = data as WorkerMessages;

    switch (message.type) {
      case WorkerMessageType.SaveGLTF:
        downloadFile(message.buffer, "scene.glb");
        break;
    }
  };

  renderWorker.addEventListener("message", onRenderWorkerMessage);

  /* Init Modules */

  await input.init(state);
  await editor.init(state);

  /* Update loop for input manager */

  function update() {
    for (let i = 0; i < state.systems.length; i++) {
      state.systems[i](state);
    }

    state.animationFrameId = requestAnimationFrame(update);
  }

  update();

  return state;
}

export function disposeEngine(state: MainThreadState) {
  if (state.animationFrameId !== undefined) {
    cancelAnimationFrame(state.animationFrameId);
  }
  input.dispose(state);
  state.gameWorker.terminate();
  state.disposeRenderWorker();
  audio.dispose(state);
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

export function sendWorldJoinedMessage(state: MainThreadState, joined: boolean) {
  state.gameWorker.postMessage({
    type: WorkerMessageType.StateChanged,
    state: {
      joined,
    },
  });
}
