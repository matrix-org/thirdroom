import { IWorld, Query } from "bitecs";

import { GLTFComponentDefinition } from "./gltf/GLTF";
import { GLTFResource } from "./gltf/gltf.game";
import { BaseThreadContext } from "./module/module.common";
import { ComponentStore } from "./resource/ComponentStore";
import { RemoteResource } from "./resource/RemoteResourceClass";
import { RemoteWorld } from "./resource/RemoteResources";
import { NetworkReplicator } from "./network/NetworkReplicator";

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

export type NetworkMessageItem = [number, ArrayBuffer, boolean];

export interface NetworkListener {
  id: number;
  inbound: NetworkMessageItem[];
}

export interface RemoteResourceManager {
  id: ResourceManagerId;
  ctx: GameState;
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
  replicators: Map<number, NetworkReplicator>;
  nextReplicatorId: number;
  matrixListening: boolean;
  inboundMatrixWidgetMessages: Uint8Array[];
  networkListeners: NetworkListener[];
  nextNetworkListenerId: number;
}

export enum ResourceManagerId {
  Global,
  Environment,
  // TODO: add ranges for avatars and objects
}

export interface GameState extends BaseThreadContext {
  mainToGameTripleBufferFlags: Uint8Array;
  renderToGameTripleBufferFlags: Uint8Array;
  gameToMainTripleBufferFlags: Uint8Array;
  gameToRenderTripleBufferFlags: Uint8Array;
  elapsed: number;
  dt: number;
  world: World;
  worldResource: RemoteWorld;
  resourceManager: RemoteResourceManager;
  resourceManagers: Map<ResourceManagerId, RemoteResourceManager>;
  editorLoaded: boolean;
}
