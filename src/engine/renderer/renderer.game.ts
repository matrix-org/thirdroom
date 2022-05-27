import {
  commitToTripleBufferView,
  createTripleBufferBackedObjectBufferView,
  TripleBufferBackedObjectBufferView,
} from "../allocator/ObjectBufferView";
import { renderableObjectBufferView } from "../component/renderable";
import { renderableSchema } from "../component/renderable.common";
import { updateMatrixWorld, worldMatrixObjectBuffer } from "../component/transform";
import { worldMatrixObjectBufferSchema } from "../component/transform.common";
import { GameState } from "../GameTypes";
import { defineModule, getModule, registerMessageHandler, Thread } from "../module/module.common";
import {
  remoteResourceLoaded,
  remoteResourceLoadError,
  remoteResourceDisposed,
  RemoteResourceManager,
  createRemoteResourceManager,
} from "../resources/RemoteResourceManager";
import {
  DisposedResourceMessage,
  LoadedResourceMessage,
  LoadErrorResourceMessage,
  WorkerMessageType,
} from "../WorkerMessage";
import { InitializeRendererTripleBuffersMessage, RendererMessageType, rendererModuleName } from "./renderer.common";

interface GameRendererModuleState {
  worldMatrixObjectTripleBuffer: TripleBufferBackedObjectBufferView<typeof worldMatrixObjectBufferSchema, ArrayBuffer>;
  renderableObjectTripleBuffer: TripleBufferBackedObjectBufferView<typeof renderableSchema, ArrayBuffer>;
  resourceManager: RemoteResourceManager;
}

export const RendererModule = defineModule<GameState, GameRendererModuleState>({
  name: rendererModuleName,
  async create({ gameToRenderTripleBufferFlags, renderPort }, { sendMessage, waitForMessage }) {
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

    sendMessage<InitializeRendererTripleBuffersMessage>(
      Thread.Render,
      RendererMessageType.InitializeRendererTripleBuffers,
      {
        renderableObjectTripleBuffer,
        worldMatrixObjectTripleBuffer,
      }
    );

    const { resourceManagerBuffer } = await waitForMessage(RendererMessageType.InitializeResourceManager);

    return {
      worldMatrixObjectTripleBuffer,
      renderableObjectTripleBuffer,
      resourceManager: createRemoteResourceManager(resourceManagerBuffer, renderPort),
    };
  },
  init(state) {
    const disposables = [
      registerMessageHandler(state, WorkerMessageType.ResourceLoaded, onResourceLoaded),
      registerMessageHandler(state, WorkerMessageType.ResourceLoadError, onResourceLoadError),
      registerMessageHandler(state, WorkerMessageType.ResourceDisposed, onResourceDisposed),
    ];

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
  updateMatrixWorld(state.scene);
  commitToTripleBufferView(renderer.worldMatrixObjectTripleBuffer);
  commitToTripleBufferView(renderer.renderableObjectTripleBuffer);
};
