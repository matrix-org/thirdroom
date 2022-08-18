import {
  commitToObjectTripleBuffer,
  createObjectBufferView,
  createObjectTripleBuffer,
  ObjectBufferView,
} from "../allocator/ObjectBufferView";
import {
  createRemotePerspectiveCamera,
  RemoteOrthographicCamera,
  RemotePerspectiveCamera,
  updateRemoteCameras,
} from "../camera/camera.game";
import { GameState } from "../GameTypes";
import { defineModule, getModule, registerMessageHandler, Thread } from "../module/module.common";
import {
  addRemoteSceneComponent,
  RemoteScene,
  RemoteSceneComponent,
  updateRendererRemoteScenes,
} from "../scene/scene.game";
import { RemoteTexture } from "../texture/texture.game";
import {
  InitializeRendererTripleBuffersMessage,
  RendererMessageType,
  rendererModuleName,
  rendererStateSchema,
  RendererStateTripleBuffer,
} from "./renderer.common";
import { RemoteUnlitMaterial, RemoteStandardMaterial, updateRemoteMaterials } from "../material/material.game";
import {
  RemoteDirectionalLight,
  RemotePointLight,
  RemoteSpotLight,
  updateRemoteDirectionalLights,
  updateRemotePointLights,
  updateRemoteRemoteSpotLights,
} from "../light/light.game";
import { RemoteMeshPrimitive, updateRemoteMeshPrimitives } from "../mesh/mesh.game";
import { addRemoteNodeComponent, RemoteNodeComponent } from "../node/node.game";
import { RenderWorkerResizeMessage, WorkerMessageType } from "../WorkerMessage";

export type RendererStateBufferView = ObjectBufferView<typeof rendererStateSchema, ArrayBuffer>;

export interface GameRendererModuleState {
  rendererStateBufferView: RendererStateBufferView;
  rendererStateTripleBuffer: RendererStateTripleBuffer;
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
  canvasWidth: number;
  canvasHeight: number;
}

export const RendererModule = defineModule<GameState, GameRendererModuleState>({
  name: rendererModuleName,
  async create({ gameToRenderTripleBufferFlags }, { sendMessage, waitForMessage }) {
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
      textures: [],
      unlitMaterials: [],
      standardMaterials: [],
      directionalLights: [],
      pointLights: [],
      spotLights: [],
      perspectiveCameras: [],
      orthographicCameras: [],
      meshPrimitives: [],
      canvasWidth: 0,
      canvasHeight: 0,
    };
  },
  async init(ctx) {
    addRemoteSceneComponent(ctx, ctx.activeScene);
    addRemoteNodeComponent(ctx, ctx.activeCamera, {
      camera: createRemotePerspectiveCamera(ctx),
    });

    return registerMessageHandler(ctx, WorkerMessageType.RenderWorkerResize, onResize);
  },
});

function onResize(state: GameState, { canvasWidth, canvasHeight }: RenderWorkerResizeMessage) {
  const renderer = getModule(state, RendererModule);
  renderer.canvasWidth = canvasWidth;
  renderer.canvasHeight = canvasHeight;
}

export const RenderableSystem = (state: GameState) => {
  const renderer = getModule(state, RendererModule);

  const activeScene = RemoteSceneComponent.get(state.activeScene);
  const activeCamera = RemoteNodeComponent.get(state.activeCamera);

  renderer.rendererStateBufferView.activeSceneResourceId[0] = activeScene?.rendererResourceId || 0;
  renderer.rendererStateBufferView.activeCameraResourceId[0] = activeCamera?.rendererResourceId || 0;

  commitToObjectTripleBuffer(renderer.rendererStateTripleBuffer, renderer.rendererStateBufferView);

  updateRendererRemoteScenes(renderer.scenes);
  updateRemoteMaterials(state);
  updateRemoteMeshPrimitives(renderer.meshPrimitives);
  updateRemotePointLights(renderer.pointLights);
  updateRemoteDirectionalLights(renderer.directionalLights);
  updateRemoteRemoteSpotLights(renderer.spotLights);
  updateRemoteCameras(state);
};
