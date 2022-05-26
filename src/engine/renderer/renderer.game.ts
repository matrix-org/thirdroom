import { copyToWriteBuffer, swapWriteBuffer, TripleBuffer } from "../allocator/TripleBuffer";
import { renderableBuffer } from "../component/buffers";
import { updateMatrixWorld } from "../component/transform";
import { GameState, IInitialGameThreadState } from "../GameTypes";
import { defineModule, getModule, registerMessageHandler } from "../module/module.common";
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

interface GameRendererModuleState {
  renderableTripleBuffer: TripleBuffer;
  resourceManager: RemoteResourceManager;
}

export const RendererModule = defineModule<GameState, IInitialGameThreadState, GameRendererModuleState>({
  create({ renderableTripleBuffer, resourceManagerBuffer, renderPort }) {
    return {
      renderableTripleBuffer,
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
  copyToWriteBuffer(renderer.renderableTripleBuffer, renderableBuffer);
  swapWriteBuffer(renderer.renderableTripleBuffer);
};
