import { addComponent, hasComponent, removeComponent } from "bitecs";

import { GameState, RemoteResourceManager } from "../GameTypes";

export interface ComponentPropertyDefinition {
  name: string;
  type: string;
  defaultValue?: boolean | number | number[];
}

interface F32Store {
  type: "f32";
  value: Float32Array;
  defaultValue: number;
}

interface RefStore {
  type: "node";
  value: Uint32Array;
  defaultValue: number;
}

interface I32Store {
  type: "i32" | "bool";
  value: Int32Array;
  defaultValue: number;
}

interface VecStore {
  type: "vec2" | "vec3" | "vec4" | "rgb" | "rgba" | "quat";
  value: Float32Array[];
  defaultValue: number[];
}

type PropStore = {
  name: string;
  size: number;
} & (I32Store | RefStore | F32Store | VecStore);

export interface ComponentStore {
  name: string;
  props: PropStore[];
  add: (ctx: GameState, eid: number) => void;
  remove: (ctx: GameState, eid: number) => void;
  has: (ctx: GameState, eid: number) => boolean;
}

export function defineComponentStore(
  resourceManager: RemoteResourceManager,
  name: string,
  props: ComponentPropertyDefinition[]
): ComponentStore {
  const maxEntities = resourceManager.maxEntities;
  const propStores: PropStore[] = [];

  for (const prop of props) {
    if (prop.type === "node") {
      propStores.push({
        name: prop.name,
        type: prop.type,
        value: new Uint32Array(maxEntities),
        size: 1,
        defaultValue: 0,
      });
    } else if (prop.type === "i32") {
      propStores.push({
        name: prop.name,
        type: prop.type,
        value: new Int32Array(maxEntities),
        size: 1,
        defaultValue: prop.defaultValue as number,
      });
    } else if (prop.type === "f32") {
      propStores.push({
        name: prop.name,
        type: prop.type,
        value: new Float32Array(maxEntities),
        size: 1,
        defaultValue: prop.defaultValue as number,
      });
    } else if (prop.type === "vec2") {
      const buffer = new ArrayBuffer(maxEntities * 2 * Float32Array.BYTES_PER_ELEMENT);
      const value = Array.from(
        { length: maxEntities },
        (_, i) => new Float32Array(buffer, i * 2 * Float32Array.BYTES_PER_ELEMENT, 2)
      );

      propStores.push({
        name: prop.name,
        type: prop.type,
        value,
        size: 2,
        defaultValue: prop.defaultValue as number[],
      });
    } else if (prop.type === "vec3" || prop.type === "rgb") {
      const buffer = new ArrayBuffer(maxEntities * 3 * Float32Array.BYTES_PER_ELEMENT);
      const value = Array.from(
        { length: maxEntities },
        (_, i) => new Float32Array(buffer, i * 3 * Float32Array.BYTES_PER_ELEMENT, 3)
      );

      propStores.push({
        name: prop.name,
        type: prop.type,
        value,
        size: 3,
        defaultValue: prop.defaultValue as number[],
      });
    } else if (prop.type === "vec4" || prop.type === "rgba" || prop.type === "quat") {
      const buffer = new ArrayBuffer(maxEntities * 4 * Float32Array.BYTES_PER_ELEMENT);
      const value = Array.from(
        { length: maxEntities },
        (_, i) => new Float32Array(buffer, i * 4 * Float32Array.BYTES_PER_ELEMENT, 4)
      );

      propStores.push({
        name: prop.name,
        type: prop.type,
        value,
        size: 4,
        defaultValue: prop.defaultValue as number[],
      });
    } else {
      throw new Error(`Unknown component property type: ${prop.type}`);
    }
  }

  const componentId = resourceManager.nextComponentId++;

  const componentStore = {
    id: componentId,
    name,
    props: [],
    add(ctx: GameState, eid: number) {
      addComponent(ctx.world, this, eid);

      for (let i = 0; i < propStores.length; i++) {
        const prop = propStores[i];

        if (prop.type === "node") {
          continue;
        }

        if (prop.defaultValue === undefined) {
          continue;
        }

        const value = prop.value;

        if (Array.isArray(value)) {
          value[eid].set(prop.defaultValue as number[]);
        } else if (prop.type === "bool") {
          value[eid] = prop.defaultValue ? 1 : 0;
        } else {
          value[eid] = prop.defaultValue as number;
        }
      }
    },
    remove(ctx: GameState, eid: number) {
      removeComponent(ctx.world, this, eid);
    },
    has(ctx: GameState, eid: number) {
      return hasComponent(ctx.world, this, eid);
    },
  };

  resourceManager.registeredComponents.set(componentId, componentStore);
  resourceManager.registeredComponentIdsByName.set(componentStore.name, componentId);

  return componentStore;
}
