import { addComponent, defineQuery, exitQuery } from "bitecs";

import { GameState, World } from "../GameTypes";
import { defineModule, getModule } from "../module/module.common";

interface PrefabModuleState {
  prefabTemplateMap: Map<string, PrefabTemplate>;
}

export const PrefabModule = defineModule<GameState, PrefabModuleState>({
  name: "prefab",
  create() {
    return {
      prefabTemplateMap: new Map(),
    };
  },
  init() {},
});

/* Prefab Functions */

export interface PrefabTemplate {
  name: string;
  create: (ctx: GameState, remote?: boolean) => number;
  delete?: (ctx: GameState) => number;
  serialize?: (ctx: GameState) => number;
  deserialize?: (ctx: GameState) => number;
}

export const Prefab: Map<number, string> = new Map();

export function registerPrefab(state: GameState, template: PrefabTemplate) {
  const prefabModule = getModule(state, PrefabModule);
  if (prefabModule.prefabTemplateMap.has(template.name)) {
    console.warn("warning: overwriting existing prefab", template.name);
  }
  prefabModule.prefabTemplateMap.set(template.name, template);
  const create = template.create;

  template.create = (ctx: GameState, remote = false) => {
    const eid = create(ctx, remote);
    addPrefabComponent(state.world, eid, template.name);
    return eid;
  };
}

const prefabQuery = defineQuery([Prefab]);
const removedPrefabQuery = exitQuery(prefabQuery);

export function PrefabDisposalSystem(state: GameState) {
  const removed = removedPrefabQuery(state.world);

  for (let i = 0; i < removed.length; i++) {
    const eid = removed[i];
    Prefab.delete(eid);
  }
}

export function getPrefabTemplate(state: GameState, name: string) {
  const prefabModule = getModule(state, PrefabModule);

  const template = prefabModule.prefabTemplateMap.get(name);
  if (!template) throw new Error("could not find template for prefab name: " + name);

  return template;
}

export const createPrefabEntity = (state: GameState, prefab: string, remote = false) => {
  const prefabModule = getModule(state, PrefabModule);
  const create = prefabModule.prefabTemplateMap.get(prefab)?.create;

  if (!create) {
    throw new Error(`Could not find prefab "${prefab}"`);
  }

  return create(state, remote);
};

export const addPrefabComponent = (world: World, eid: number, prefab: string) => {
  addComponent(world, Prefab, eid);
  Prefab.set(eid, prefab);
};

export const removePrefabComponent = (world: World, eid: number) => {
  addComponent(world, Prefab, eid);
  Prefab.delete(eid);
};
