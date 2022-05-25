import { IWorld } from "bitecs";

import { TripleBufferState } from "./allocator/TripleBuffer";
import { TripleBufferView } from "./allocator/TripleBufferView";
import { InputState } from "./input/input.common";
import { BaseThreadContext, ThreadSystem } from "./module/module.common";
import { PrefabTemplate } from "./prefab";
import { RemoteResourceManager } from "./resources/RemoteResourceManager";
import { StatsBuffer } from "./stats/stats.common";

export type World = IWorld;

export type RenderPort = MessagePort | (typeof globalThis & Worker);

export interface RenderState {
  tripleBuffer: TripleBufferState;
  port: RenderPort;
}

export interface TimeState {
  elapsed: number;
  dt: number;
}

export interface GameState extends BaseThreadContext {
  world: World;
  renderer: RenderState;
  time: TimeState;
  resourceManager: RemoteResourceManager;
  prefabTemplateMap: Map<string, PrefabTemplate>;
  entityPrefabMap: Map<number, string>;
  systems: Map<ThreadSystem<GameState>, boolean>;
  scene: number;
  camera: number;
}

export interface IInitialGameThreadState {
  inputStateTripleBufferView: TripleBufferView<InputState>;
  audioTripleBuffer: TripleBufferState;
  hierarchyTripleBuffer: TripleBufferState;
  statsBuffer: StatsBuffer;
}
