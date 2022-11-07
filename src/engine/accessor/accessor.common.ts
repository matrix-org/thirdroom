import { ResourceId } from "../resource/resource.common";

export const AccessorResourceType = "accessor";

export type AccessorTypedArrayConstructor =
  | Int8ArrayConstructor
  | Uint8ArrayConstructor
  | Int16ArrayConstructor
  | Uint16ArrayConstructor
  | Uint32ArrayConstructor
  | Float32ArrayConstructor;

export type AccessorTypedArray = Int8Array | Uint8Array | Int16Array | Uint16Array | Uint32Array | Float32Array;

export type AccessorSparseIndicesArrayConstructor =
  | Uint8ArrayConstructor
  | Uint16ArrayConstructor
  | Uint32ArrayConstructor;

export type AccessorSparseIndicesArray = Uint8Array | Uint16Array | Uint32Array;

export enum AccessorComponentType {
  Int8 = 5120,
  Uint8 = 5121,
  Int16 = 5122,
  Uint16 = 5123,
  Uint32 = 5125,
  Float32 = 5126,
}

export type AccessorSparseIndicesComponentType =
  | AccessorComponentType.Uint8
  | AccessorComponentType.Uint16
  | AccessorComponentType.Uint32;

export enum AccessorType {
  SCALAR = "SCALAR",
  VEC2 = "VEC2",
  VEC3 = "VEC3",
  VEC4 = "VEC4",
  MAT2 = "MAT2",
  MAT3 = "MAT3",
  MAT4 = "MAT4",
}

export const AccessorComponentTypeToTypedArray: {
  [key: number]: AccessorTypedArrayConstructor;
  [AccessorComponentType.Int8]: Int8ArrayConstructor;
  [AccessorComponentType.Uint8]: Uint8ArrayConstructor;
  [AccessorComponentType.Int16]: Int16ArrayConstructor;
  [AccessorComponentType.Uint16]: Uint16ArrayConstructor;
  [AccessorComponentType.Uint32]: Uint32ArrayConstructor;
  [AccessorComponentType.Float32]: Float32ArrayConstructor;
} = {
  [AccessorComponentType.Int8]: Int8Array,
  [AccessorComponentType.Uint8]: Uint8Array,
  [AccessorComponentType.Int16]: Int16Array,
  [AccessorComponentType.Uint16]: Uint16Array,
  [AccessorComponentType.Uint32]: Uint32Array,
  [AccessorComponentType.Float32]: Float32Array,
};

export const AccessorTypeToItemSize: {
  [key: string]: number;
} = {
  [AccessorType.SCALAR]: 1,
  [AccessorType.VEC2]: 2,
  [AccessorType.VEC3]: 3,
  [AccessorType.VEC4]: 4,
  [AccessorType.MAT2]: 4,
  [AccessorType.MAT3]: 9,
  [AccessorType.MAT4]: 16,
};

export type TypedArrayFromAccessor<C extends AccessorComponentType> = InstanceType<
  typeof AccessorComponentTypeToTypedArray[C]
>;

interface AccessorSparseIndicesResourceProps {
  bufferView: ResourceId;
  byteOffset: number;
  componentType: AccessorSparseIndicesComponentType;
}

interface AccessorSparseValuesResourceProps {
  bufferView: ResourceId;
  byteOffset: number;
}

interface AccessorSparseResourceProps {
  count: number;
  indices: AccessorSparseIndicesResourceProps;
  values: AccessorSparseValuesResourceProps;
}

export interface AccessorResourceProps {
  type: AccessorType;
  componentType: AccessorComponentType;
  bufferView?: ResourceId;
  count: number;
  byteOffset: number;
  normalized: boolean;
  min?: number[];
  max?: number[];
  sparse?: AccessorSparseResourceProps;
}
