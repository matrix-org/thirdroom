import { GameState } from "../GameTypes";
import { defineModule, getModule, registerMessageHandler, Thread } from "../module/module.common";
import {
  CanvasResizeMessage,
  NotifySceneRendererMessage,
  RendererMessageType,
  rendererModuleName,
  SceneRenderedNotificationMessage,
} from "./renderer.common";
import { createDeferred, Deferred } from "../utils/Deferred";
import { createDisposables } from "../utils/createDisposables";

export interface GameRendererModuleState {
  canvasWidth: number;
  canvasHeight: number;
  sceneRenderedNotificationId: number;
  sceneRenderedNotificationHandlers: Map<number, Deferred<void>>;
}

export const RendererModule = defineModule<GameState, GameRendererModuleState>({
  name: rendererModuleName,
  async create() {
    return {
      canvasWidth: 0,
      canvasHeight: 0,
      sceneRenderedNotificationId: 0,
      sceneRenderedNotificationHandlers: new Map(),
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

export function waitForCurrentSceneToRender(ctx: GameState): Promise<void> {
  const deferred = createDeferred<void>(false);
  const rendererModule = getModule(ctx, RendererModule);
  const id = rendererModule.sceneRenderedNotificationId++;
  rendererModule.sceneRenderedNotificationHandlers.set(id, deferred);

  const sceneResourceId = ctx.worldResource.environment?.activeScene?.resourceId;

  if (sceneResourceId === undefined) {
    throw new Error("activeScene not set");
  }

  ctx.sendMessage<NotifySceneRendererMessage>(Thread.Render, {
    type: RendererMessageType.NotifySceneRendered,
    sceneResourceId,
    id,
  });

  return deferred.promise;
}
