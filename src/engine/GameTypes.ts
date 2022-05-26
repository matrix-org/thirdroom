import { IWorld } from "bitecs";

import { TripleBuffer } from "./allocator/TripleBuffer";
import { TripleBufferView } from "./allocator/TripleBufferView";
import { InputState } from "./input/input.common";
import { BaseThreadContext } from "./module/module.common";
import { PrefabTemplate } from "./prefab";
import { StatsBuffer } from "./stats/stats.common";

export type World = IWorld;

export type RenderPort = MessagePort | (typeof globalThis & Worker);

export interface RenderState {
  tripleBuffer: TripleBuffer;
  port: RenderPort;
}

export interface GameState extends BaseThreadContext {
  elapsed: number;
  dt: number;
  world: World;
  renderer: RenderState;
  prefabTemplateMap: Map<string, PrefabTemplate>;
  entityPrefabMap: Map<number, string>;
  scene: number;
  camera: number;
}

export interface IInitialGameThreadState {
  renderPort: RenderPort;
  inputStateTripleBufferView: TripleBufferView<InputState>;
  audioTripleBuffer: TripleBuffer;
  hierarchyTripleBuffer: TripleBuffer;
  statsBuffer: StatsBuffer;
  resourceManagerBuffer: SharedArrayBuffer;
  renderableTripleBuffer: TripleBuffer;
}
