import { IWorld } from "bitecs";

import { BaseThreadContext } from "./module/module.common";
import { GameResourceManager } from "./resource/GameResourceManager";

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
  resourceManager: GameResourceManager;
}
