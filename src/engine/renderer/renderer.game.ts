import {
  commitToObjectTripleBuffer,
  createObjectBufferView,
  createObjectTripleBuffer,
  ObjectTripleBuffer,
} from "../allocator/ObjectBufferView";
import {
  createRemotePerspectiveCamera,
  RemoteOrthographicCamera,
  RemotePerspectiveCamera,
  updateRemoteCameras,
} from "../camera/camera.game";
import { GameState } from "../GameTypes";
import { defineModule, getModule, Thread } from "../module/module.common";
import {
  addRemoteSceneComponent,
  RemoteScene,
  RemoteSceneComponent,
  updateRendererRemoteScenes,
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
import { RemoteMeshPrimitive } from "../mesh/mesh.game";
import { addRemoteNodeComponent } from "../node/node.game";

export interface GameRendererModuleState {
  sharedRendererState: ObjectTripleBuffer<typeof rendererSchema>;
  scenes: RemoteScene[];
  textures: RemoteTexture[];
  unlitMaterials: RemoteUnlitMaterial[];
  standardMaterials: RemoteStandardMaterial[];
  directionalLights: RemoteDirectionalLight[];
  pointLights: RemotePointLight[];
  spotLights: RemoteSpotLight[];
  perspectiveCameras: RemotePerspectiveCamera[];
  orthographicCameras: RemoteOrthographicCamera[];
  meshPrimitives: RemoteMeshPrimitive[];
}

export const RendererModule = defineModule<GameState, GameRendererModuleState>({
  name: rendererModuleName,
  async create({ gameToRenderTripleBufferFlags }, { sendMessage }) {
    const sharedRendererState = createObjectTripleBuffer(rendererSchema, gameToRenderTripleBufferFlags);

    sendMessage<InitializeRendererTripleBuffersMessage>(
      Thread.Render,
      RendererMessageType.InitializeRendererTripleBuffers,
      {
        sharedRendererState,
      }
    );

    return {
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
      meshPrimitives: [],
    };
  },
  async init(ctx) {
    addRemoteSceneComponent(ctx, ctx.activeScene);
    addRemoteNodeComponent(ctx, ctx.activeCamera, {
      camera: createRemotePerspectiveCamera(ctx),
    });
  },
});

export const RenderableSystem = (state: GameState) => {
  const renderer = getModule(state, RendererModule);

  const activeScene = RemoteSceneComponent.get(state.activeScene);
  const activeCamera = RemoteSceneComponent.get(state.activeCamera);

  renderer.sharedRendererState.activeSceneResourceId[0] = activeScene?.rendererResourceId || 0;
  renderer.sharedRendererState.activeCameraResourceId[0] = activeCamera?.rendererResourceId || 0;

  commitToObjectTripleBuffer(renderer.sharedRendererState);

  updateRendererRemoteScenes(renderer.scenes);
  updateRemoteTextures(renderer.textures);
  updateRemoteMaterials(state);
  updateRemoteCameras(state);
};
