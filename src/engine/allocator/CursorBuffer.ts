import { ComponentPropertyType } from "../component/types";
import { TypedArray, TypedArrayConstructor } from "./types";
import { roundUpToMultiple4, roundUpToMultiple8 } from "./util";

const $cursor = Symbol("cursor");
const $byteView = Symbol("byteView");

export type CursorBuffer = ArrayBuffer & {
  [$cursor]: number;
  [$byteView]: Uint8Array;
};

export const createCursorBuffer = (buffer: ArrayBuffer = new ArrayBuffer(1e7 /*10MB*/)): CursorBuffer => {
  (buffer as CursorBuffer)[$cursor] = 0;
  (buffer as CursorBuffer)[$byteView] = new Uint8Array(buffer.byteLength);
  return buffer as CursorBuffer;
};

export const clearCursorBuffer = (cb: CursorBuffer) => {
  cb[$byteView].fill(0, 0, cb[$cursor]);
};

export const roundCursor = <T extends TypedArrayConstructor>(buffer: CursorBuffer, type: T) => {
  const { name } = type;
  if (name.includes("32")) buffer[$cursor] = roundUpToMultiple4(buffer[$cursor]);
  if (name.includes("64")) buffer[$cursor] = roundUpToMultiple8(buffer[$cursor]);
};

export const addView = <T extends TypedArrayConstructor>(
  buffer: CursorBuffer,
  Type: T,
  size: number,
  defaultValues?: InstanceType<T>
): InstanceType<T> => {
  roundCursor(buffer, Type);

  const store = new Type(buffer, buffer[$cursor], size);
  buffer[$cursor] += size * store.BYTES_PER_ELEMENT;

  if (defaultValues) store.set(defaultValues as any);

  return store as InstanceType<T>;
};

export const addViewAoA = <T extends TypedArrayConstructor>(
  buffer: CursorBuffer,
  type: T,
  stride: number,
  size: number
): InstanceType<T>[] => {
  const store = addView<T>(buffer, type, size * stride);
  const array = Array(size);
  for (let i = 0; i < size; i++) {
    array[i] = store.subarray(i * stride, i * stride + stride);
  }
  return array;
};

export const addViewVector3 = (stackBuffer: CursorBuffer, n: number) => addViewAoA(stackBuffer, Float32Array, 3, n);
export const addViewVector4 = (stackBuffer: CursorBuffer, n: number) => addViewAoA(stackBuffer, Float32Array, 4, n);
export const addViewMatrix4 = (stackBuffer: CursorBuffer, n: number) => addViewAoA(stackBuffer, Float32Array, 16, n);

export function addViewByComponentPropertyType(
  buffer: CursorBuffer,
  propertyType: ComponentPropertyType,
  size: number
): TypedArray | TypedArray[] | undefined {
  if (propertyType === ComponentPropertyType.vec3) {
    return addViewVector3(buffer, size);
  }
}
