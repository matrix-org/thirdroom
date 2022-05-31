import RAPIER from "@dimforge/rapier3d-compat";
import { createWorld } from "bitecs";

import { RemoteResourceInfo, RemoteResourceManager } from "../../src/engine/resources/RemoteResourceManager";
import { PostMessageTarget } from "../../src/engine/WorkerMessage";
import { registerPrefab } from "../../src/engine/prefab";
import { GameState } from "../../src/engine/GameTypes";
import { NetworkModule } from "../../src/engine/network/network.game";
import { RendererModule } from "../../src/engine/renderer/renderer.game";
import { worldMatrixObjectBufferSchema } from "../../src/engine/component/transform.common";
import { worldMatrixObjectBuffer } from "../../src/engine/component/transform";
import { createTripleBufferBackedObjectBufferView } from "../../src/engine/allocator/ObjectBufferView";
import { renderableSchema } from "../../src/engine/component/renderable.common";
import { renderableObjectBufferView } from "../../src/engine/component/renderable";
import { PhysicsModule } from "../../src/engine/physics/physics.game";

export function registerDefaultPrefabs(state: GameState) {
  registerPrefab(state, {
    name: "random-cube",
    create: () => {},
  });
  registerPrefab(state, {
    name: "red-cube",
    create: () => {},
  });
  registerPrefab(state, {
    name: "musical-cube",
    create: () => {},
  });
  registerPrefab(state, {
    name: "green-cube",
    create: () => {},
  });
  registerPrefab(state, {
    name: "blue-cube",
    create: () => {},
  });
  registerPrefab(state, {
    name: "player-cube",
    create: () => {},
  });
}

export const mockPostMessageTarget = () =>
  ({
    postMessage: (message: any, transfer?: Array<Transferable | OffscreenCanvas>) => {},
    addEventListener: (
      type: string,
      callback: ((message: any) => void) | null,
      options?: AddEventListenerOptions | boolean
    ) => {},
    removeEventListener: (
      type: string,
      callback: ((message: any) => void) | null,
      options?: EventListenerOptions | boolean
    ) => {},
  } as PostMessageTarget);

export const mockRemoteResourceManager = (buffer = new SharedArrayBuffer(4)) =>
  ({
    buffer,
    view: new Uint32Array(buffer),
    postMessageTarget: mockPostMessageTarget(),
    store: new Map<number, RemoteResourceInfo<any>>(),
  } as RemoteResourceManager);

export const mockPhysicsState = () => ({
  physicsWorld: {
    createRigidBody: (body: RAPIER.RigidBodyDesc) => ({
      handle: 0,
      lockTranslations: () => {},
      lockRotations: () => {},
    }),
    createCollider: (desc: RAPIER.ColliderDesc, parentHandle?: number | undefined) => {},
  } as unknown as RAPIER.World,
});

export const mockRenderState = () => {
  const worldMatrixObjectTripleBuffer = createTripleBufferBackedObjectBufferView(
    worldMatrixObjectBufferSchema,
    worldMatrixObjectBuffer,
    new Uint8Array()
  );

  const renderableObjectTripleBuffer = createTripleBufferBackedObjectBufferView(
    renderableSchema,
    renderableObjectBufferView,
    new Uint8Array()
  );

  return {
    worldMatrixObjectTripleBuffer,
    renderableObjectTripleBuffer,
    resourceManager: mockRemoteResourceManager(),
  };
};

export const mockNetworkState = () => ({
  networkIdToEntityId: new Map(),
});

export const mockGameState = () => {
  const ctx = {
    world: createWorld(),
    prefabTemplateMap: new Map(),
    entityPrefabMap: new Map(),
    renderer: mockRenderState(),
    renderPort: mockPostMessageTarget(),
    systemGraphChanged: true,
    systemGraph: [],
    systems: [],
    messageHandlers: new Map(),
    scopes: new Map(),
    modules: new Map(),
  } as unknown as GameState;

  ctx.modules.set(PhysicsModule, mockPhysicsState());
  ctx.modules.set(NetworkModule, mockNetworkState());
  ctx.modules.set(RendererModule, mockRenderState());

  registerDefaultPrefabs(ctx);

  return ctx;
};
