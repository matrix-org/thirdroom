import { MemPool } from "@thi.ng/malloc";
import { IWorld } from "bitecs";

import { TripleBuffer } from "./allocator/TripleBuffer";
import { BaseThreadContext } from "./module/module.common";
import { GameResourceManager } from "./resource/GameResourceManager";
import { RemoteWorld } from "./resource/RemoteResources";

export type World = IWorld;

export interface GameState extends BaseThreadContext {
  mainToGameTripleBufferFlags: Uint8Array;
  renderToGameTripleBufferFlags: Uint8Array;
  gameToMainTripleBufferFlags: Uint8Array;
  gameToRenderTripleBufferFlags: Uint8Array;
  memPool: MemPool;
  localHeap: SharedArrayBuffer;
  sharedHeap: TripleBuffer;
  elapsed: number;
  dt: number;
  tick: number;
  world: World;
  worldResource: RemoteWorld;
  resourceManager: GameResourceManager;
}
