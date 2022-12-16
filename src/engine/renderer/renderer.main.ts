import { defineModule, Thread } from "../module/module.common";
import { IMainThreadContext } from "../MainThread";
import { WorkerMessageType } from "../WorkerMessage";
import { RendererMessageType, rendererModuleName } from "./renderer.common";
import { createDisposables } from "../utils/createDisposables";

type MainRendererModuleState = {};

export const RendererModule = defineModule<IMainThreadContext, MainRendererModuleState>({
  name: rendererModuleName,
  async create({ canvas, useOffscreenCanvas }, { sendMessage }) {
    const canvasTarget = useOffscreenCanvas ? canvas.transferControlToOffscreen() : canvas;

    sendMessage(
      Thread.Render,
      RendererMessageType.InitializeCanvas,
      {
        canvasTarget: useOffscreenCanvas ? canvasTarget : undefined,
        initialCanvasWidth: canvas.clientWidth,
        initialCanvasHeight: canvas.clientHeight,
      },
      useOffscreenCanvas ? [canvasTarget as OffscreenCanvas] : undefined
    );
    return {};
  },
  init(ctx) {
    ctx.sendMessage(Thread.Render, {
      type: WorkerMessageType.RenderWorkerResize,
      canvasWidth: ctx.canvas.clientWidth,
      canvasHeight: ctx.canvas.clientHeight,
    });
    ctx.sendMessage(Thread.Game, {
      type: WorkerMessageType.RenderWorkerResize,
      canvasWidth: ctx.canvas.clientWidth,
      canvasHeight: ctx.canvas.clientHeight,
    });
    return createDisposables([registerResizeEventHandler(ctx)]);
  },
});

const registerResizeEventHandler = (ctx: IMainThreadContext) => {
  function onResize() {
    ctx.sendMessage(Thread.Render, {
      type: WorkerMessageType.RenderWorkerResize,
      canvasWidth: ctx.canvas.clientWidth,
      canvasHeight: ctx.canvas.clientHeight,
    });
    ctx.sendMessage(Thread.Game, {
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
