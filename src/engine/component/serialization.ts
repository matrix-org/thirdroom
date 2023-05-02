import { GameState } from "../GameTypes";
import { ComponentPropertyType, ComponentPropertyStore, ComponentPropertyValue } from "./types";

export type ComponentPropertyGetter<T extends ComponentPropertyType = ComponentPropertyType> = (
  state: GameState,
  eid: number
) => ComponentPropertyValue<T>;

export const ComponentPropertyGetters: {
  [T in ComponentPropertyType]: (store: ComponentPropertyStore<T>) => ComponentPropertyGetter<T>;
} = {
  [ComponentPropertyType.vec3]: (store) => (state, eid) => {
    return store[eid];
  },
};

export type ComponentPropertySetter<T extends ComponentPropertyType = ComponentPropertyType> = (
  state: GameState,
  eid: number,
  value: ComponentPropertyValue<T>
) => void;

export const ComponentPropertySetters: {
  [T in ComponentPropertyType]: (store: ComponentPropertyStore<T>) => ComponentPropertySetter<T>;
} = {
  [ComponentPropertyType.vec3]: (store) => (state, eid, value) => {
    store[eid].set(value);
  },
};
