import { addEntity } from "bitecs";

import {
  commitToTripleBufferView,
  createObjectBufferView,
  createTripleBufferBackedObjectBufferView,
  TripleBufferBackedObjectBufferView,
} from "../allocator/ObjectBufferView";
import { addPerspectiveCameraResource } from "../camera/camera.game";
import { renderableObjectBufferView } from "../component/renderable";
import { renderableSchema } from "../component/renderable.common";
import { addTransformComponent, updateMatrixWorld, worldMatrixObjectBuffer } from "../component/transform";
import { worldMatrixObjectBufferSchema } from "../component/transform.common";
import { GameState } from "../GameTypes";
import { defineModule, getModule, registerMessageHandler, Thread } from "../module/module.common";
import { waitForRemoteResource } from "../resource/resource.game";
import {
  remoteResourceLoaded,
  remoteResourceLoadError,
  remoteResourceDisposed,
  RemoteResourceManager,
  createRemoteResourceManager,
} from "../resources/RemoteResourceManager";
import { addSceneResource } from "../scene/scene.game";
import {
  DisposedResourceMessage,
  LoadedResourceMessage,
  LoadErrorResourceMessage,
  WorkerMessageType,
} from "../WorkerMessage";
import {
  InitializeRendererTripleBuffersMessage,
  RendererMessageType,
  rendererModuleName,
  rendererSchema,
} from "./renderer.common";

interface GameRendererModuleState {
  sharedRendererState: TripleBufferBackedObjectBufferView<typeof rendererSchema, ArrayBuffer>;
  worldMatrixObjectTripleBuffer: TripleBufferBackedObjectBufferView<typeof worldMatrixObjectBufferSchema, ArrayBuffer>;
  renderableObjectTripleBuffer: TripleBufferBackedObjectBufferView<typeof renderableSchema, ArrayBuffer>;
  resourceManager: RemoteResourceManager;
}

export const RendererModule = defineModule<GameState, GameRendererModuleState>({
  name: rendererModuleName,
  async create({ world, gameToRenderTripleBufferFlags, renderPort }, { sendMessage, waitForMessage }) {
    const worldMatrixObjectTripleBuffer = createTripleBufferBackedObjectBufferView(
      worldMatrixObjectBufferSchema,
      worldMatrixObjectBuffer,
      gameToRenderTripleBufferFlags
    );

    const renderableObjectTripleBuffer = createTripleBufferBackedObjectBufferView(
      renderableSchema,
      renderableObjectBufferView,
      gameToRenderTripleBufferFlags
    );

    const scene = addEntity(world);
    addTransformComponent(world, scene);

    const camera = addEntity(world);
    addTransformComponent(world, camera);

    const rendererState = createObjectBufferView(rendererSchema, ArrayBuffer);

    rendererState.scene[0] = scene;
    rendererState.camera[0] = camera;

    const sharedRendererState = createTripleBufferBackedObjectBufferView(
      rendererSchema,
      rendererState,
      gameToRenderTripleBufferFlags
    );

    sendMessage<InitializeRendererTripleBuffersMessage>(
      Thread.Render,
      RendererMessageType.InitializeRendererTripleBuffers,
      {
        sharedRendererState,
        renderableObjectTripleBuffer,
        worldMatrixObjectTripleBuffer,
      }
    );

    const { resourceManagerBuffer } = await waitForMessage(
      Thread.Render,
      RendererMessageType.InitializeResourceManager
    );

    return {
      scene,
      camera,
      sharedRendererState,
      worldMatrixObjectTripleBuffer,
      renderableObjectTripleBuffer,
      resourceManager: createRemoteResourceManager(resourceManagerBuffer, renderPort),
    };
  },
  async init(state) {
    const disposables = [
      registerMessageHandler(state, WorkerMessageType.ResourceLoaded, onResourceLoaded),
      registerMessageHandler(state, WorkerMessageType.ResourceLoadError, onResourceLoadError),
      registerMessageHandler(state, WorkerMessageType.ResourceDisposed, onResourceDisposed),
    ];

    const scene = getActiveScene(state);
    const remoteScene = addSceneResource(state, scene);
    await waitForRemoteResource(state, remoteScene.resourceId);

    const camera = getActiveCamera(state);
    const remoteCamera = addPerspectiveCameraResource(state, camera, {
      znear: 0.1,
      yfov: 70,
    });
    await waitForRemoteResource(state, remoteCamera.resourceId);

    return () => {
      for (const dispose of disposables) {
        dispose();
      }
    };
  },
});

function onResourceLoaded(state: GameState, message: LoadedResourceMessage) {
  const renderer = getModule(state, RendererModule);
  remoteResourceLoaded(renderer.resourceManager, message.resourceId, message.remoteResource);
}

function onResourceLoadError(state: GameState, message: LoadErrorResourceMessage<Error>) {
  const renderer = getModule(state, RendererModule);
  remoteResourceLoadError(renderer.resourceManager, message.resourceId, message.error);
}

function onResourceDisposed(state: GameState, message: DisposedResourceMessage) {
  const renderer = getModule(state, RendererModule);
  remoteResourceDisposed(renderer.resourceManager, message.resourceId);
}

export const RenderableSystem = (state: GameState) => {
  const renderer = getModule(state, RendererModule);
  const scene = getActiveScene(state);
  updateMatrixWorld(scene);
  commitToTripleBufferView(renderer.worldMatrixObjectTripleBuffer);
  commitToTripleBufferView(renderer.renderableObjectTripleBuffer);
  commitToTripleBufferView(renderer.sharedRendererState);
};

export function getActiveScene(ctx: GameState) {
  const renderer = getModule(ctx, RendererModule);
  return renderer.sharedRendererState.scene[0];
}

export function setActiveScene(ctx: GameState, eid: number) {
  const renderer = getModule(ctx, RendererModule);
  renderer.sharedRendererState.scene[0] = eid;
}

export function getActiveCamera(ctx: GameState) {
  const renderer = getModule(ctx, RendererModule);
  return renderer.sharedRendererState.camera[0];
}

export function setActiveCamera(ctx: GameState, eid: number) {
  const renderer = getModule(ctx, RendererModule);
  renderer.sharedRendererState.camera[0] = eid;
}
