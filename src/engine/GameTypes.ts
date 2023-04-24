import { IWorld, Query } from "bitecs";

import { GLTFResource } from "./gltf/gltf.game";
import { BaseThreadContext } from "./module/module.common";
import { ComponentStore } from "./resource/ComponentStore";
import { RemoteResource } from "./resource/RemoteResourceClass";
import { RemoteWorld } from "./resource/RemoteResources";

export type World = IWorld;

export interface ResourceManagerGLTFCacheEntry {
  refCount: number;
  promise: Promise<GLTFResource>;
}

export interface ComponentPropType {
  name: string;
  type: string;
}

export interface RemoteResourceManager {
  ctx: GameState;
  resourceIds: Set<number>;
  resourceMap: Map<number, string | ArrayBuffer | RemoteResource>;
  gltfCache: Map<string, ResourceManagerGLTFCacheEntry>;
  nextQueryId: number;
  registeredQueries: Map<number, Query>;
  maxEntities: number;
  nextComponentId: number;
  registeredComponents: Map<number, ComponentStore>;
  registeredComponentIdsByName: Map<string, number>;
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
  editorLoaded: boolean;
}
