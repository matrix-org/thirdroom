import { GameState } from "../GameTypes";
import { defineModule, getModule, registerMessageHandler, Thread } from "../module/module.common";
import {
  CanvasResizeMessage,
  NotifySceneRendererMessage,
  RendererMessageType,
  rendererModuleName,
  SceneRenderedNotificationMessage,
  XRMode,
} from "./renderer.common";
import { createDeferred, Deferred } from "../utils/Deferred";
import { createDisposables } from "../utils/createDisposables";

export interface GameRendererModuleState {
  canvasWidth: number;
  canvasHeight: number;
  sceneRenderedNotificationId: number;
  sceneRenderedNotificationHandlers: Map<number, Deferred<void>>;
  xrMode: Uint8Array;
  prevXRMode: XRMode;
}

export const RendererModule = defineModule<GameState, GameRendererModuleState>({
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
    };
  },
  async init(ctx) {
    return createDisposables([
      registerMessageHandler(ctx, RendererMessageType.CanvasResize, onResize),
      registerMessageHandler(ctx, RendererMessageType.SceneRenderedNotification, onSceneRenderedNotification),
    ]);
  },
});

function onResize(state: GameState, { canvasWidth, canvasHeight }: CanvasResizeMessage) {
  const renderer = getModule(state, RendererModule);
  renderer.canvasWidth = canvasWidth;
  renderer.canvasHeight = canvasHeight;
}

function onSceneRenderedNotification(ctx: GameState, { id }: SceneRenderedNotificationMessage) {
  const renderer = getModule(ctx, RendererModule);
  const handler = renderer.sceneRenderedNotificationHandlers.get(id);

  if (handler) {
    handler.resolve();
    renderer.sceneRenderedNotificationHandlers.delete(id);
  }
}

export function waitForCurrentSceneToRender(ctx: GameState, frames = 1): Promise<void> {
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

export function getXRMode(ctx: GameState): XRMode {
  const rendererModule = getModule(ctx, RendererModule);
  return rendererModule.xrMode[0];
}
