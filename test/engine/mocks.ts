import RAPIER from "@dimforge/rapier3d-compat";
import { createWorld } from "bitecs";

import { RemoteResourceInfo, RemoteResourceManager } from "../../src/engine/resources/RemoteResourceManager";
import { PostMessageTarget } from "../../src/engine/WorkerMessage";
import { createTripleBuffer } from "../../src/engine/allocator/TripleBuffer";
import { registerDefaultPrefabs } from "../../src/engine/prefab";
import { GameState } from "../../src/engine/GameTypes";

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

export const mockPhysicsWorld = () => ({
  createRigidBody: (body: RAPIER.RigidBodyDesc) => ({
    handle: 0,
    lockTranslations: () => {},
    lockRotations: () => {},
  }),
  createCollider: (desc: RAPIER.ColliderDesc, parentHandle?: number | undefined) => {},
});

export const mockRenderState = () => ({
  tripleBuffer: createTripleBuffer(),
  port: mockPostMessageTarget(),
});

export const mockNetworkState = () => ({
  networkIdToEntityId: new Map(),
});

export const mockGameState = () => {
  const gameState = {
    world: createWorld(),
    prefabTemplateMap: new Map(),
    entityPrefabMap: new Map(),
    resourceManager: mockRemoteResourceManager(),
    physicsWorld: mockPhysicsWorld(),
    renderer: mockRenderState(),
    systemGraphChanged: true,
    systemGraph: [],
    systems: [],
    messageHandlers: new Map(),
    scopes: new Map(),
  } as unknown as GameState;

  registerDefaultPrefabs(gameState);

  return gameState;
};
