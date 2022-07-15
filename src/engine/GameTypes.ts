import { IWorld } from "bitecs";

import { BaseThreadContext } from "./module/module.common";

export type World = IWorld;

export type RenderPort = MessagePort | (typeof globalThis & Worker);

export interface GameState extends BaseThreadContext {
  mainToGameTripleBufferFlags: Uint8Array;
  gameToMainTripleBufferFlags: Uint8Array;
  gameToRenderTripleBufferFlags: Uint8Array;
  elapsed: number;
  dt: number;
  world: World;
  activeScene: number;
  activeCamera: number;
  renderPort: RenderPort;
}
