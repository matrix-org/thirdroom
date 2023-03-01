import { defineModule, Thread } from "../module/module.common";
import { IMainThreadContext } from "../MainThread";
import { InitializeCanvasMessage, RendererMessageType, rendererModuleName } from "./renderer.common";
import { createDisposables } from "../utils/createDisposables";

type MainRendererModuleState = {};

export const RendererModule = defineModule<IMainThreadContext, MainRendererModuleState>({
  name: rendererModuleName,
  async create({ canvas, useOffscreenCanvas, supportedXRSessionModes, quality }, { sendMessage }) {
    const canvasTarget = useOffscreenCanvas ? canvas.transferControlToOffscreen() : canvas;

    sendMessage<InitializeCanvasMessage>(
      Thread.Render,
      RendererMessageType.InitializeCanvas,
      {
        canvasTarget: useOffscreenCanvas ? (canvasTarget as OffscreenCanvas) : undefined,
        initialCanvasWidth: canvas.clientWidth,
        initialCanvasHeight: canvas.clientHeight,
        supportedXRSessionModes,
        quality,
      },
      useOffscreenCanvas ? [canvasTarget as OffscreenCanvas] : undefined
    );
    return {};
  },
  init(ctx) {
    ctx.sendMessage(Thread.Render, {
      type: RendererMessageType.CanvasResize,
      canvasWidth: ctx.canvas.clientWidth,
      canvasHeight: ctx.canvas.clientHeight,
    });
    ctx.sendMessage(Thread.Game, {
      type: RendererMessageType.CanvasResize,
      canvasWidth: ctx.canvas.clientWidth,
      canvasHeight: ctx.canvas.clientHeight,
    });
    return createDisposables([registerResizeEventHandler(ctx)]);
  },
});

const registerResizeEventHandler = (ctx: IMainThreadContext) => {
  function onResize() {
    ctx.sendMessage(Thread.Render, {
      type: RendererMessageType.CanvasResize,
      canvasWidth: ctx.canvas.clientWidth,
      canvasHeight: ctx.canvas.clientHeight,
    });
    ctx.sendMessage(Thread.Game, {
      type: RendererMessageType.CanvasResize,
      canvasWidth: ctx.canvas.clientWidth,
      canvasHeight: ctx.canvas.clientHeight,
    });
  }

  window.addEventListener("resize", onResize);

  return () => {
    window.removeEventListener("resize", onResize);
  };
};
