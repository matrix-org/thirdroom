export enum ComponentPropertyType {
  vec3,
}

interface ComponentPropertyTypeToStore {
  [ComponentPropertyType.vec3]: Float32Array[];
}

export type ComponentPropertyStore<T extends ComponentPropertyType = ComponentPropertyType> =
  ComponentPropertyTypeToStore[T];

interface ComponentPropertyTypeToValue {
  [ComponentPropertyType.vec3]: Float32Array;
}

export type ComponentPropertyValue<T extends ComponentPropertyType = ComponentPropertyType> =
  ComponentPropertyTypeToValue[T];

export interface ComponentPropertyInfo {
  id: number;
  name: string;
  type: ComponentPropertyType;
}

export interface ComponentInfo {
  name: string;
  props: ComponentPropertyInfo[];
}
