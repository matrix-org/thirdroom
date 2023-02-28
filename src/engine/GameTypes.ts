import { IWorld } from "bitecs";

import { GLTFResource } from "./gltf/gltf.game";
import { BaseThreadContext } from "./module/module.common";
import { RemoteResource } from "./resource/RemoteResourceClass";
import { RemoteWorld } from "./resource/RemoteResources";

export type World = IWorld;

export interface ResourceManagerGLTFCacheEntry {
  refCount: number;
  promise: Promise<GLTFResource>;
}

export interface RemoteResourceManager {
  ctx: GameState;
  resourceIds: Set<number>;
  resourceMap: Map<number, string | ArrayBuffer | RemoteResource>;
  gltfCache: Map<string, ResourceManagerGLTFCacheEntry>;
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
