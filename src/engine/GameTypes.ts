import { IWorld, Query } from "bitecs";

import { GLTFComponentDefinition } from "./gltf/GLTF";
import { GLTFResource } from "./gltf/gltf.game";
import { BaseThreadContext } from "./module/module.common";
import { ComponentStore } from "./resource/ComponentStore";
import { RemoteResource } from "./resource/RemoteResourceClass";
import { RemoteWorld } from "./resource/RemoteResources";
import { Replicator } from "./network/Replicator";

export type World = IWorld;

export interface ResourceManagerGLTFCacheEntry {
  refCount: number;
  promise: Promise<GLTFResource>;
}

export interface Collision {
  nodeA: number;
  nodeB: number;
  started: boolean;
}

export interface CollisionListener {
  id: number;
  collisions: Collision[];
}

export interface ActionBarListener {
  id: number;
  actions: string[];
}

export interface NetworkListener {
  id: number;
  inbound: [string, ArrayBuffer, boolean][];
}

export interface RemoteResourceManager {
  id: string;
  ctx: GameContext;
  resourceIds: Set<number>;
  resourceMap: Map<number, string | ArrayBuffer | RemoteResource>;
  gltfCache: Map<string, ResourceManagerGLTFCacheEntry>;
  nextQueryId: number;
  registeredQueries: Map<number, Query>;
  maxEntities: number;
  nextComponentId: number;
  componentStoreSize: number;
  componentIdsByName: Map<string, number>;
  componentStores: Map<number, ComponentStore>;
  componentDefinitions: Map<number, GLTFComponentDefinition>;
  nextComponentStoreIndex: number;
  nodeIdToComponentStoreIndex: Map<number, number>;
  collisionListeners: CollisionListener[];
  nextCollisionListenerId: number;
  actionBarListeners: ActionBarListener[];
  nextActionBarListenerId: number;
  replicators: Map<number, Replicator>;
  nextReplicatorId: number;
  matrixListening: boolean;
  inboundMatrixWidgetMessages: Uint8Array[];
  networkListeners: NetworkListener[];
  nextNetworkListenerId: number;
}

export interface GameContext extends BaseThreadContext {
  mainToGameTripleBufferFlags: Uint8Array;
  renderToGameTripleBufferFlags: Uint8Array;
  gameToMainTripleBufferFlags: Uint8Array;
  gameToRenderTripleBufferFlags: Uint8Array;
  elapsed: number;
  dt: number;
  world: World;
  worldResource: RemoteWorld;
  resourceManager: RemoteResourceManager;
  editorLoaded: boolean;
}
