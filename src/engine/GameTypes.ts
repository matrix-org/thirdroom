import { IWorld } from "bitecs";

import { TripleBuffer } from "./allocator/TripleBuffer";
import { TripleBufferView } from "./allocator/TripleBufferView";
import { InputState } from "./input/input.common";
import { BaseThreadContext, ThreadSystem } from "./module/module.common";
import { PrefabTemplate } from "./prefab";
import { StatsBuffer } from "./stats/stats.common";

export type World = IWorld;

export type RenderPort = MessagePort | (typeof globalThis & Worker);

export interface GameState extends BaseThreadContext {
  world: World;
  dt: number;
  renderPort: RenderPort;
  elapsed: number;
  prefabTemplateMap: Map<string, PrefabTemplate>;
  entityPrefabMap: Map<number, string>;
  systems: ThreadSystem<GameState>[];
  scene: number;
  camera: number;
}

export interface IInitialGameThreadState {
  renderableTripleBuffer: TripleBuffer;
  renderWorkerMessagePort?: MessagePort;
  resourceManagerBuffer: SharedArrayBuffer;
  inputStateTripleBufferView: TripleBufferView<InputState>;
  audioTripleBuffer: TripleBuffer;
  hierarchyTripleBuffer: TripleBuffer;
  statsBuffer: StatsBuffer;
  renderPort: RenderPort;
}
