import { addEntity } from "bitecs";

import {
  commitToTripleBufferView,
  createObjectBufferView,
  createTripleBufferBackedObjectBufferView,
  TripleBufferBackedObjectBufferView,
} from "../allocator/ObjectBufferView";
import {
  addRemoteCameraComponent,
  createRemotePerspectiveCamera,
  RemoteCameraComponent,
  RemoteOrthographicCamera,
  RemotePerspectiveCamera,
  updateRemoteCameras,
} from "../camera/camera.game";
import { addChild, addTransformComponent, updateMatrixWorld } from "../component/transform";
import { GameState } from "../GameTypes";
import { defineModule, getModule, Thread } from "../module/module.common";
import { waitForRemoteResource } from "../resource/resource.game";
import {
  addRemoteSceneComponent,
  createRemoteSceneResource,
  RemoteScene,
  RemoteSceneComponent,
  updateRemoteScenes,
} from "../scene/scene.game";
import { RemoteTexture, updateRemoteTextures } from "../texture/texture.game";
import {
  InitializeRendererTripleBuffersMessage,
  RendererMessageType,
  rendererModuleName,
  rendererSchema,
} from "./renderer.common";
import { RemoteUnlitMaterial, RemoteStandardMaterial, updateRemoteMaterials } from "../material/material.game";
import { RemoteDirectionalLight, RemotePointLight, RemoteSpotLight } from "../light/light.game";

export interface GameRendererModuleState {
  activeScene: number;
  activeCamera: number;
  sharedRendererState: TripleBufferBackedObjectBufferView<typeof rendererSchema, ArrayBuffer>;
  scenes: RemoteScene[];
  textures: RemoteTexture[];
  unlitMaterials: RemoteUnlitMaterial[];
  standardMaterials: RemoteStandardMaterial[];
  directionalLights: RemoteDirectionalLight[];
  pointLights: RemotePointLight[];
  spotLights: RemoteSpotLight[];
  perspectiveCameras: RemotePerspectiveCamera[];
  orthographicCameras: RemoteOrthographicCamera[];
}

export const RendererModule = defineModule<GameState, GameRendererModuleState>({
  name: rendererModuleName,
  async create({ world, gameToRenderTripleBufferFlags, renderPort }, { sendMessage, waitForMessage }) {
    const rendererState = createObjectBufferView(rendererSchema, ArrayBuffer);

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
      }
    );

    const activeScene = addEntity(world);
    addTransformComponent(world, activeScene);

    const activeCamera = addEntity(world);
    addTransformComponent(world, activeCamera);
    addChild(activeScene, activeCamera);

    return {
      activeScene,
      activeCamera,
      sharedRendererState,
      scenes: [],
      textures: [],
      unlitMaterials: [],
      standardMaterials: [],
      directionalLights: [],
      pointLights: [],
      spotLights: [],
      perspectiveCameras: [],
      orthographicCameras: [],
    };
  },
  async init(state) {
    const scene = getActiveScene(state);
    const remoteScene = createRemoteSceneResource(state);
    addRemoteSceneComponent(state, scene, remoteScene);
    await waitForRemoteResource(state, remoteScene.resourceId);

    const camera = getActiveCamera(state);
    const remoteCamera = createRemotePerspectiveCamera(state, {
      znear: 0.1,
      yfov: 70,
    });
    addRemoteCameraComponent(state, camera, remoteCamera);
    await waitForRemoteResource(state, remoteCamera.resourceId);
  },
});

export const RenderableSystem = (state: GameState) => {
  const renderer = getModule(state, RendererModule);
  const scene = getActiveScene(state);

  updateMatrixWorld(scene);

  commitToTripleBufferView(renderer.sharedRendererState);

  updateRemoteScenes(renderer.scenes);
  updateRemoteTextures(renderer.textures);
  updateRemoteMaterials(state);
  updateRemoteCameras(state);
};

export function getActiveScene(ctx: GameState) {
  const renderer = getModule(ctx, RendererModule);
  return renderer.activeScene;
}

export function setActiveScene(ctx: GameState, eid: number) {
  const renderer = getModule(ctx, RendererModule);
  const remoteScene = RemoteSceneComponent.get(eid);

  if (remoteScene) {
    renderer.activeScene = eid;
    renderer.sharedRendererState.activeSceneResourceId[0] = remoteScene.resourceId;
  }
}

export function getActiveCamera(ctx: GameState) {
  const renderer = getModule(ctx, RendererModule);
  return renderer.activeCamera;
}

export function setActiveCamera(ctx: GameState, eid: number) {
  const renderer = getModule(ctx, RendererModule);
  const remoteCamera = RemoteCameraComponent.get(eid);

  if (remoteCamera) {
    renderer.activeCamera = eid;
    renderer.sharedRendererState.activeCameraResourceId[0] = remoteCamera.resourceId;
  }
}
