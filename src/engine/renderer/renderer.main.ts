import { defineModule, Thread } from "../module/module.common";
import { IMainThreadContext } from "../MainThread";
import { WorkerMessageType } from "../WorkerMessage";
import { RendererMessageType, rendererModuleName } from "./renderer.common";
import { registerResource } from "../resource/resource.main";
import { createDisposables } from "../utils/createDisposables";
import {
  AccessorResource,
  BufferResource,
  BufferViewResource,
  CameraResource,
  ImageResource,
  InstancedMeshResource,
  InteractableResource,
  LightMapResource,
  LightResource,
  MaterialResource,
  MeshPrimitiveResource,
  MeshResource,
  ReflectionProbeResource,
  SamplerResource,
  SkinResource,
  TextureResource,
  TilesRendererResource,
} from "../resource/schema";
import { MainNode } from "../node/node.main";
import { MainThreadNametagResource } from "../nametag/nametag.main";

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
    return createDisposables([
      registerResizeEventHandler(ctx),
      registerResource(ctx, LightResource),
      registerResource(ctx, SamplerResource),
      registerResource(ctx, CameraResource),
      registerResource(ctx, BufferResource),
      registerResource(ctx, BufferViewResource),
      registerResource(ctx, ImageResource),
      registerResource(ctx, MaterialResource),
      registerResource(ctx, TextureResource),
      registerResource(ctx, MeshResource),
      registerResource(ctx, MainNode),
      registerResource(ctx, MainThreadNametagResource),
      registerResource(ctx, MeshPrimitiveResource),
      registerResource(ctx, InteractableResource),
      registerResource(ctx, AccessorResource),
      registerResource(ctx, MeshResource),
      registerResource(ctx, MeshPrimitiveResource),
      registerResource(ctx, SkinResource),
      registerResource(ctx, InstancedMeshResource),
      registerResource(ctx, LightMapResource),
      registerResource(ctx, ReflectionProbeResource),
      registerResource(ctx, TilesRendererResource),
    ]);
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
