export enum ComponentPropertyType {
  Int8,
  Int16,
  Int32,
  Uint8,
  Uint16,
  Uint32,
  Float32,
  Float64,
  Boolean,
  String,
  Vector2,
  Vector3,
  Vector4,
  Quaternion,
  RGB,
  RGBA,
  Matrix3,
  Matrix4,
  Node,
}

interface ComponentPropertyTypeToStore {
  [ComponentPropertyType.Int8]: Int8Array;
  [ComponentPropertyType.Int16]: Int16Array;
  [ComponentPropertyType.Int32]: Int32Array;
  [ComponentPropertyType.Uint8]: Uint8Array;
  [ComponentPropertyType.Uint16]: Uint16Array;
  [ComponentPropertyType.Uint32]: Uint32Array;
  [ComponentPropertyType.Float32]: Float32Array;
  [ComponentPropertyType.Float64]: Float64Array;
  [ComponentPropertyType.Boolean]: boolean[];
  [ComponentPropertyType.String]: string[];
  [ComponentPropertyType.Vector2]: Float32Array[];
  [ComponentPropertyType.Vector3]: Float32Array[];
  [ComponentPropertyType.Vector4]: Float32Array[];
  [ComponentPropertyType.Quaternion]: Float32Array[];
  [ComponentPropertyType.RGB]: Float32Array[];
  [ComponentPropertyType.RGBA]: Float32Array[];
  [ComponentPropertyType.Matrix3]: Float32Array[];
  [ComponentPropertyType.Matrix4]: Float32Array[];
  [ComponentPropertyType.Node]: unknown[];
}

export type ComponentPropertyStore<T extends ComponentPropertyType = ComponentPropertyType> =
  ComponentPropertyTypeToStore[T];

interface ComponentPropertyTypeToValue {
  [ComponentPropertyType.Int8]: number;
  [ComponentPropertyType.Int16]: number;
  [ComponentPropertyType.Int32]: number;
  [ComponentPropertyType.Uint8]: number;
  [ComponentPropertyType.Uint16]: number;
  [ComponentPropertyType.Uint32]: number;
  [ComponentPropertyType.Float32]: number;
  [ComponentPropertyType.Float64]: number;
  [ComponentPropertyType.Boolean]: boolean;
  [ComponentPropertyType.String]: string;
  [ComponentPropertyType.Vector2]: Float32Array;
  [ComponentPropertyType.Vector3]: Float32Array;
  [ComponentPropertyType.Vector4]: Float32Array;
  [ComponentPropertyType.Quaternion]: Float32Array;
  [ComponentPropertyType.RGB]: Float32Array;
  [ComponentPropertyType.RGBA]: Float32Array;
  [ComponentPropertyType.Matrix3]: Float32Array;
  [ComponentPropertyType.Matrix4]: Float32Array;
  [ComponentPropertyType.Node]: unknown;
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
