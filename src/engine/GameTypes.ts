import { IWorld } from "bitecs";

import { BaseThreadContext } from "./module/module.common";

export type World = IWorld;

export interface GameState extends BaseThreadContext {
  mainToGameTripleBufferFlags: Uint8Array;
  gameToMainTripleBufferFlags: Uint8Array;
  gameToRenderTripleBufferFlags: Uint8Array;
  elapsed: number;
  dt: number;
  world: World;
  activeScene: number;
  activeCamera: number;
}
