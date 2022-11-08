import RAPIER from "@dimforge/rapier3d-compat";
import { addEntity, createWorld } from "bitecs";

import { PostMessageTarget } from "../../src/engine/WorkerMessage";
import { PrefabModule, registerPrefab } from "../../src/engine/prefab/prefab.game";
import { GameState } from "../../src/engine/GameTypes";
import { NetworkModule } from "../../src/engine/network/network.game";
import { RendererModule } from "../../src/engine/renderer/renderer.game";
import { PhysicsModule } from "../../src/engine/physics/physics.game";
import { ResourceModule } from "../../src/engine/resource/resource.game";

export function registerDefaultPrefabs(state: GameState) {
  registerPrefab(state, {
    name: "test-prefab",
    create: () => addEntity(state.world),
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

export const mockPhysicsState = () => ({
  physicsWorld: {
    createRigidBody: (body: RAPIER.RigidBodyDesc) => ({
      handle: 0,
      lockTranslations: () => {},
      lockRotations: () => {},
      numColliders: () => 1,
      collider: () => 1,
    }),
    createCollider: (desc: RAPIER.ColliderDesc, parentHandle?: number | undefined) => {},
    getCollider: () => ({
      collisionGroups: () => 0,
      setActiveEvents: () => {},
      setCollisionGroups: () => {},
    }),
  } as unknown as RAPIER.World,
});

export const mockRenderState = () => ({
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
});

export const mockNetworkState = () => ({
  networkIdToEntityId: new Map(),
});

export const mockResourceModule = () => ({
  resourceIdMap: new Map(),
  resources: new Map(),
  resourceInfos: new Map(),
  deferredResources: new Map(),
  renderThreadMessageQueue: [],
  renderThreadTransferList: [],
  mainThreadMessageQueue: [],
});

export const mockPrefabState = () => ({
  prefabTemplateMap: new Map(),
});

export const mockResourceManager = () => ({
  createResource: () => ({}),
});

export const mockGameState = () => {
  const ctx = {
    world: createWorld(),
    renderer: mockRenderState(),
    renderPort: mockPostMessageTarget(),
    systemGraphChanged: true,
    systemGraph: [],
    systems: [],
    messageHandlers: new Map(),
    scopes: new Map(),
    modules: new Map(),
    resourceManager: mockResourceManager(),
  } as unknown as GameState;

  ctx.modules.set(PhysicsModule, mockPhysicsState());
  ctx.modules.set(NetworkModule, mockNetworkState());
  ctx.modules.set(RendererModule, mockRenderState());
  ctx.modules.set(ResourceModule, mockResourceModule());
  ctx.modules.set(PrefabModule, mockPrefabState());

  registerDefaultPrefabs(ctx);

  return ctx;
};
