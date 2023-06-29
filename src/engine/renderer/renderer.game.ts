import { vec3 } from "gl-matrix";

import { GameContext } from "../GameTypes";
import { defineModule, getModule, registerMessageHandler, Thread } from "../module/module.common";
import {
  CanvasResizeMessage,
  NotifySceneRendererMessage,
  PhysicsDebugRenderTripleBuffer,
  PhysicsDisableDebugRenderMessage,
  PhysicsEnableDebugRenderMessage,
  RendererMessageType,
  rendererModuleName,
  SceneRenderedNotificationMessage,
  SharedXRInputSource,
  UICanvasFocusMessage,
  UICanvasPressMessage,
  UpdateXRInputSourcesMessage,
  XRMode,
} from "./renderer.common";
import { createDeferred, Deferred } from "../utils/Deferred";
import { createDisposables } from "../utils/createDisposables";
import {
  createObjectTripleBuffer,
  defineObjectBufferSchema,
  getWriteObjectBufferView,
} from "../allocator/ObjectBufferView";
import { RemoteNode } from "../resource/RemoteResources";

export interface GameRendererModuleState {
  canvasWidth: number;
  canvasHeight: number;
  sceneRenderedNotificationId: number;
  sceneRenderedNotificationHandlers: Map<number, Deferred<void>>;
  xrMode: Uint8Array;
  prevXRMode: XRMode;
  debugRender: boolean;
  debugRenderTripleBuffer?: PhysicsDebugRenderTripleBuffer;
  xrInputSources: Map<number, SharedXRInputSource>;
  xrInputSourceNodes: Map<number, RemoteNode[]>;
  xrInputSourcesByHand: Map<XRHandedness, SharedXRInputSource>;
  xrPrimaryHand: XRHandedness;
  removedInputSources: SharedXRInputSource[];
}

export const RendererModule = defineModule<GameContext, GameRendererModuleState>({
  name: rendererModuleName,
  async create(ctx, { waitForMessage }) {
    const xrMode = await waitForMessage<Uint8Array>(
      Thread.Render,
      RendererMessageType.InitializeGameRendererTripleBuffer
    );

    return {
      canvasWidth: 0,
      canvasHeight: 0,
      sceneRenderedNotificationId: 0,
      sceneRenderedNotificationHandlers: new Map(),
      xrMode,
      prevXRMode: XRMode.None,
      debugRender: false,
      xrInputSources: new Map(),
      xrInputSourceEntities: new Map(),
      xrPrimaryHand: "right",
      xrInputSourcesByHand: new Map(),
      xrInputSourceNodes: new Map(),
      removedInputSources: [],
    };
  },
  async init(ctx) {
    return createDisposables([
      registerMessageHandler(ctx, RendererMessageType.CanvasResize, onResize),
      registerMessageHandler(ctx, RendererMessageType.SceneRenderedNotification, onSceneRenderedNotification),
      registerMessageHandler(ctx, RendererMessageType.TogglePhysicsDebug, onTogglePhysicsDebug),
      registerMessageHandler(ctx, RendererMessageType.UpdateXRInputSources, onUpdateXRInputSources),
    ]);
  },
});

function onResize(ctx: GameContext, { canvasWidth, canvasHeight }: CanvasResizeMessage) {
  const renderer = getModule(ctx, RendererModule);
  renderer.canvasWidth = canvasWidth;
  renderer.canvasHeight = canvasHeight;
}

function onSceneRenderedNotification(ctx: GameContext, { id }: SceneRenderedNotificationMessage) {
  const renderer = getModule(ctx, RendererModule);
  const handler = renderer.sceneRenderedNotificationHandlers.get(id);

  if (handler) {
    handler.resolve();
    renderer.sceneRenderedNotificationHandlers.delete(id);
  }
}

function onTogglePhysicsDebug(ctx: GameContext) {
  const renderModule = getModule(ctx, RendererModule);
  renderModule.debugRender = !renderModule.debugRender;
}

function onUpdateXRInputSources(ctx: GameContext, { added, removed }: UpdateXRInputSourcesMessage) {
  const { xrInputSources, xrInputSourcesByHand, removedInputSources } = getModule(ctx, RendererModule);

  for (const id of removed) {
    const inputSource = xrInputSources.get(id);

    if (inputSource) {
      xrInputSourcesByHand.delete(inputSource.handedness);
      xrInputSources.delete(id);
      removedInputSources.push(inputSource);
    }
  }

  for (const item of added) {
    xrInputSources.set(item.id, item);
    xrInputSourcesByHand.set(item.handedness, item);
  }
}

export function waitForCurrentSceneToRender(ctx: GameContext, frames = 1): Promise<void> {
  const deferred = createDeferred<void>(false);
  const rendererModule = getModule(ctx, RendererModule);
  const id = rendererModule.sceneRenderedNotificationId++;
  rendererModule.sceneRenderedNotificationHandlers.set(id, deferred);

  const sceneResourceId = ctx.worldResource.environment?.publicScene.eid;

  if (sceneResourceId === undefined) {
    throw new Error("activeScene not set");
  }

  ctx.sendMessage<NotifySceneRendererMessage>(Thread.Render, {
    type: RendererMessageType.NotifySceneRendered,
    sceneResourceId,
    id,
    frames,
  });

  return deferred.promise;
}

export function getXRMode(ctx: GameContext): XRMode {
  const rendererModule = getModule(ctx, RendererModule);
  return rendererModule.xrMode[0];
}

interface PhysicsDebugBuffers {
  vertices: Float32Array;
  colors: Float32Array;
}

export function updatePhysicsDebugBuffers(ctx: GameContext, getDebugBuffers: () => PhysicsDebugBuffers) {
  const rendererModule = getModule(ctx, RendererModule);

  if (rendererModule.debugRender) {
    const buffers = getDebugBuffers();

    if (!rendererModule.debugRenderTripleBuffer) {
      // Allow for double the number of vertices at the start.
      const initialSize = (buffers.vertices.length / 3) * 2;

      const physicsDebugRenderSchema = defineObjectBufferSchema({
        size: [Uint32Array, 1],
        vertices: [Float32Array, initialSize * 3],
        colors: [Float32Array, initialSize * 4],
      });

      const tripleBuffer = createObjectTripleBuffer(physicsDebugRenderSchema, ctx.gameToRenderTripleBufferFlags);

      rendererModule.debugRenderTripleBuffer = tripleBuffer;

      ctx.sendMessage<PhysicsEnableDebugRenderMessage>(Thread.Render, {
        type: RendererMessageType.PhysicsEnableDebugRender,
        tripleBuffer,
      });
    }

    const writeView = getWriteObjectBufferView(rendererModule.debugRenderTripleBuffer);
    writeView.size[0] = buffers.vertices.length / 3;
    writeView.vertices.set(buffers.vertices);
    writeView.colors.set(buffers.colors);
  } else if (rendererModule.debugRenderTripleBuffer) {
    ctx.sendMessage<PhysicsDisableDebugRenderMessage>(Thread.Render, {
      type: RendererMessageType.PhysicsDisableDebugRender,
    });
    rendererModule.debugRenderTripleBuffer = undefined;
  }
}

export function setRenderNodeOptimizationsEnabled(ctx: GameContext, enabled: boolean) {
  ctx.sendMessage(Thread.Render, {
    type: RendererMessageType.SetNodeOptimizationsEnabled,
    enabled,
  });
}

export function notifyUICanvasPressed(ctx: GameContext, hitPoint: vec3, node: RemoteNode) {
  const uiCanvas = node.uiCanvas;
  ctx.sendMessage<UICanvasPressMessage>(Thread.Render, {
    type: RendererMessageType.UICanvasPress,
    hitPoint,
    uiCanvasEid: uiCanvas!.eid,
  });
}

export function notifyUICanvasFocus(ctx: GameContext, hitPoint: vec3, node: RemoteNode) {
  const uiCanvas = node.uiCanvas;
  ctx.sendMessage<UICanvasFocusMessage>(Thread.Render, {
    type: RendererMessageType.UICanvasFocus,
    hitPoint,
    uiCanvasEid: uiCanvas!.eid,
  });
}
