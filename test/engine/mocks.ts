import RAPIER from "@dimforge/rapier3d-compat";
import { addEntity, createWorld } from "bitecs";

import { PrefabModule, PrefabType, registerPrefab } from "../../src/engine/prefab/prefab.game";
import { GameContext } from "../../src/engine/GameTypes";
import { NetworkModule } from "../../src/engine/network/network.game";
import { RendererModule } from "../../src/engine/renderer/renderer.game";
import { PhysicsModule } from "../../src/engine/physics/physics.game";
import { createRemoteResourceManager, ResourceModule } from "../../src/engine/resource/resource.game";
import { RemoteNode, RemoteScene, RemoteWorld, RemoteEnvironment } from "../../src/engine/resource/RemoteResources";
import { addChild } from "../../src/engine/component/transform";
import { MatrixModule } from "../../src/engine/matrix/matrix.game";
import { WebSGNetworkModule } from "../../src/engine/network/scripting.game";
import { XRMode } from "../../src/engine/renderer/renderer.common";

export function registerDefaultPrefabs(ctx: GameContext) {
  registerPrefab(ctx, {
    name: "test-prefab",
    type: PrefabType.Object,
    create: () => {
      return new RemoteNode(ctx.resourceManager);
    },
  });
}

export const mockPostMessageTarget = () => ({
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
});

export const mockPhysicsState = () => ({
  handleToEid: new Map(),
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

const peerInfo = {
  key: "a",
  id: 1,
  lastUpdate: 0,
  xrMode: XRMode.None,
};

export const mockNetworkState = () => ({
  networkIdToEntityId: new Map(),
  peerIndexCount: 1,
  peerIdToInfo: new Map(),
  peerKeyToInfo: new Map(),
  replicators: new Map(),
  replicatorIdCount: 1,
  host: peerInfo,
  local: peerInfo,
  peers: [],
});

export const mockResourceModule = () => ({
  resourceDefByType: new Map(),
  resources: [],
  resourceInfos: new Map(),
  resourceMap: new Map(),
  resourcesByType: new Map(),
  disposedResourcesQueue: [],
  disposeRefCounts: new Map(),
  deferredRemovals: [],
});

export const mockMatrixModule = () => ({
  inboundWidgetMessages: [],
});

export const mockWebSGNetworkModule = () => ({
  inbound: [],
});

export const mockPrefabState = () => ({
  prefabTemplateMap: new Map(),
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
    resourceManager: undefined as any,
  } as unknown as GameContext;

  ctx.modules.set(PhysicsModule, mockPhysicsState());
  ctx.modules.set(NetworkModule, mockNetworkState());
  ctx.modules.set(RendererModule, mockRenderState());
  ctx.modules.set(ResourceModule, mockResourceModule());
  ctx.modules.set(PrefabModule, mockPrefabState());
  ctx.modules.set(MatrixModule, mockMatrixModule());
  ctx.modules.set(WebSGNetworkModule, mockWebSGNetworkModule());

  // NOOP Entity
  addEntity(ctx.world);

  ctx.resourceManager = createRemoteResourceManager(ctx, "global");

  const activeCameraNode = new RemoteNode(ctx.resourceManager, {
    name: "Camera",
  });
  const persistentScene = new RemoteScene(ctx.resourceManager, {
    name: "Persistent Scene",
  });
  addChild(persistentScene, activeCameraNode);

  ctx.worldResource = new RemoteWorld(ctx.resourceManager, {
    environment: new RemoteEnvironment(ctx.resourceManager, {
      publicScene: new RemoteScene(ctx.resourceManager, {
        name: "Public Scene",
      }),
      privateScene: new RemoteScene(ctx.resourceManager, {
        name: "Private Scene",
      }),
    }),
    activeCameraNode,
    persistentScene,
  });

  registerDefaultPrefabs(ctx);

  return ctx;
};
