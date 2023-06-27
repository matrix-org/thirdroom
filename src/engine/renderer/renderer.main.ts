import { defineModule, Thread } from "../module/module.common";
import { MainContext } from "../MainThread";
import {
  InitializeRendererMessage,
  PrintRenderThreadStateMessage,
  RendererMessageType,
  rendererModuleName,
  RenderStatNames,
  RenderStatsBuffer,
  TogglePhysicsDebugMessage,
} from "./renderer.common";
import { createDisposables } from "../utils/createDisposables";

export interface MainRendererModuleState {
  statsBuffer: RenderStatsBuffer;
}

export const RendererModule = defineModule<MainContext, MainRendererModuleState>({
  name: rendererModuleName,
  async create({ canvas, inputRingBuffer, useOffscreenCanvas, supportedXRSessionModes, quality }, { sendMessage }) {
    const canvasTarget = useOffscreenCanvas ? canvas.transferControlToOffscreen() : canvas;

    const statsBuffer = createRenderStatsBuffer();

    sendMessage<InitializeRendererMessage>(
      Thread.Render,
      RendererMessageType.InitializeRenderer,
      {
        canvasTarget: useOffscreenCanvas ? (canvasTarget as OffscreenCanvas) : undefined,
        initialCanvasWidth: canvas.clientWidth,
        initialCanvasHeight: canvas.clientHeight,
        supportedXRSessionModes,
        quality,
        statsBuffer,
        inputRingBuffer,
      },
      useOffscreenCanvas ? [canvasTarget as OffscreenCanvas] : undefined
    );

    return {
      statsBuffer,
    };
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

const registerResizeEventHandler = (ctx: MainContext) => {
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

export function togglePhysicsDebug(ctx: MainContext) {
  ctx.sendMessage<TogglePhysicsDebugMessage>(Thread.Game, {
    type: RendererMessageType.TogglePhysicsDebug,
  });
}

export function printRenderThreadState(ctx: MainContext) {
  ctx.sendMessage<PrintRenderThreadStateMessage>(Thread.Render, {
    type: RendererMessageType.PrintRenderThreadState,
  });
}

function createRenderStatsBuffer(): RenderStatsBuffer {
  const buffer = new SharedArrayBuffer(Float32Array.BYTES_PER_ELEMENT * RenderStatNames.length);

  return {
    buffer,
    f32: new Float32Array(buffer),
    u32: new Uint32Array(buffer),
  };
}
