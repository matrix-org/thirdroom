import { defineModule, Thread } from "../module/module.common";
import { IMainThreadContext } from "../MainThread";
import { WorkerMessageType } from "../WorkerMessage";
import { RendererMessageType, rendererModuleName } from "./renderer.common";
import { registerResourceLoader } from "../resource/resource.main";
import { BufferViewResourceType, onLoadBufferView } from "../bufferView/bufferView.common";
import { createDisposables } from "../utils/createDisposables";

type MainRendererModuleState = {};

export const RendererModule = defineModule<IMainThreadContext, MainRendererModuleState>({
  name: rendererModuleName,
  async create({ canvas }, { sendMessage }) {
    const canvasTarget = window.OffscreenCanvas ? canvas.transferControlToOffscreen() : canvas;
    const isOffscreenCanvas = window.OffscreenCanvas && canvasTarget instanceof OffscreenCanvas;

    sendMessage(
      Thread.Render,
      RendererMessageType.InitializeCanvas,
      {
        canvasTarget: isOffscreenCanvas ? canvasTarget : undefined,
        initialCanvasWidth: canvas.clientWidth,
        initialCanvasHeight: canvas.clientHeight,
      },
      isOffscreenCanvas ? [canvasTarget] : undefined
    );

    return {};
  },
  init(ctx) {
    return createDisposables([
      registerResizeEventHandler(ctx),
      registerResourceLoader(ctx, BufferViewResourceType, onLoadBufferView),
    ]);
  },
});

const registerResizeEventHandler = (ctx: IMainThreadContext) => {
  function onResize() {
    ctx.renderWorker.postMessage({
      type: WorkerMessageType.RenderWorkerResize,
      canvasWidth: ctx.canvas.clientWidth,
      canvasHeight: ctx.canvas.clientHeight,
    });
  }

  window.addEventListener("resize", onResize);

  return () => {
    window.removeEventListener("resize", onResize);
  };
};
