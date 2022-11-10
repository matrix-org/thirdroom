import {
  commitToObjectTripleBuffer,
  createObjectBufferView,
  createObjectTripleBuffer,
  ObjectBufferView,
} from "../allocator/ObjectBufferView";
import { createRemotePerspectiveCamera } from "../camera/camera.game";
import { GameState } from "../GameTypes";
import { defineModule, getModule, registerMessageHandler, Thread } from "../module/module.common";
import {
  addRemoteSceneComponent,
  RemoteScene,
  RemoteSceneComponent,
  updateRendererRemoteScenes,
} from "../scene/scene.game";
import {
  InitializeRendererTripleBuffersMessage,
  NotifySceneRendererMessage,
  RendererMessageType,
  rendererModuleName,
  rendererStateSchema,
  RendererStateTripleBuffer,
  SceneRenderedNotificationMessage,
} from "./renderer.common";
import { RemoteMeshPrimitive, updateRemoteMeshPrimitives } from "../mesh/mesh.game";
import { addRemoteNodeComponent, RemoteNodeComponent } from "../node/node.game";
import { RenderWorkerResizeMessage, WorkerMessageType } from "../WorkerMessage";
import { createDeferred, Deferred } from "../utils/Deferred";
import { createDisposables } from "../utils/createDisposables";

export type RendererStateBufferView = ObjectBufferView<typeof rendererStateSchema, ArrayBuffer>;

export interface GameRendererModuleState {
  rendererStateBufferView: RendererStateBufferView;
  rendererStateTripleBuffer: RendererStateTripleBuffer;
  scenes: RemoteScene[];
  meshPrimitives: RemoteMeshPrimitive[];
  canvasWidth: number;
  canvasHeight: number;
  sceneRenderedNotificationId: number;
  sceneRenderedNotificationHandlers: Map<number, Deferred<void>>;
}

export const RendererModule = defineModule<GameState, GameRendererModuleState>({
  name: rendererModuleName,
  async create({ gameToRenderTripleBufferFlags }, { sendMessage }) {
    const rendererStateBufferView = createObjectBufferView(rendererStateSchema, ArrayBuffer);
    const rendererStateTripleBuffer = createObjectTripleBuffer(rendererStateSchema, gameToRenderTripleBufferFlags);

    sendMessage<InitializeRendererTripleBuffersMessage>(
      Thread.Render,
      RendererMessageType.InitializeRendererTripleBuffers,
      {
        rendererStateTripleBuffer,
      }
    );

    return {
      rendererStateBufferView,
      rendererStateTripleBuffer,
      scenes: [],
      unlitMaterials: [],
      standardMaterials: [],
      meshPrimitives: [],
      canvasWidth: 0,
      canvasHeight: 0,
      sceneRenderedNotificationId: 0,
      sceneRenderedNotificationHandlers: new Map(),
    };
  },
  async init(ctx) {
    addRemoteSceneComponent(ctx, ctx.activeScene);
    addRemoteNodeComponent(ctx, ctx.activeCamera, {
      camera: createRemotePerspectiveCamera(ctx),
    });

    return createDisposables([
      registerMessageHandler(ctx, WorkerMessageType.RenderWorkerResize, onResize),
      registerMessageHandler(ctx, RendererMessageType.SceneRenderedNotification, onSceneRenderedNotification),
    ]);
  },
});

function onResize(state: GameState, { canvasWidth, canvasHeight }: RenderWorkerResizeMessage) {
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

export const RenderableSystem = (state: GameState) => {
  const renderer = getModule(state, RendererModule);

  const activeScene = RemoteSceneComponent.get(state.activeScene);
  const activeCamera = RemoteNodeComponent.get(state.activeCamera);

  renderer.rendererStateBufferView.activeSceneResourceId[0] = activeScene?.rendererResourceId || 0;
  renderer.rendererStateBufferView.activeCameraResourceId[0] = activeCamera?.rendererResourceId || 0;

  commitToObjectTripleBuffer(renderer.rendererStateTripleBuffer, renderer.rendererStateBufferView);

  updateRendererRemoteScenes(renderer.scenes);
  updateRemoteMeshPrimitives(renderer.meshPrimitives);
};

export function waitForCurrentSceneToRender(ctx: GameState): Promise<void> {
  const deferred = createDeferred<void>(false);
  const rendererModule = getModule(ctx, RendererModule);
  const id = rendererModule.sceneRenderedNotificationId++;
  rendererModule.sceneRenderedNotificationHandlers.set(id, deferred);

  const sceneResourceId = RemoteSceneComponent.get(ctx.activeScene)?.rendererResourceId;

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
