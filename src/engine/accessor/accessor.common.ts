import { mat4 } from "gl-matrix";

import { AccessorComponentType, AccessorType } from "../resource/schema";

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

export type AccessorSparseIndicesComponentType =
  | AccessorComponentType.Uint8
  | AccessorComponentType.Uint16
  | AccessorComponentType.Uint32;

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

export const AccessorTypeToElementSize: {
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

type BufferViewLike = { buffer: { data: SharedArrayBuffer }; byteOffset: number; byteStride: number };

type AccessorSparseLike = {
  count: number;
  indicesBufferView: BufferViewLike;
  indicesByteOffset: number;
  indicesComponentType: AccessorComponentType;
  valuesBufferView: BufferViewLike;
  valuesByteOffset: number;
};

type AccessorLike = {
  count: number;
  type: AccessorType;
  componentType: AccessorComponentType;
  bufferView?: BufferViewLike;
  byteOffset: number;
  sparse?: AccessorSparseLike;
};

export function getAccessorArrayView(accessor: AccessorLike, deinterleave = true): AccessorTypedArray {
  const elementCount = accessor.count;
  const elementSize = AccessorTypeToElementSize[accessor.type];
  const arrConstructor = AccessorComponentTypeToTypedArray[accessor.componentType];
  const componentByteLength = arrConstructor.BYTES_PER_ELEMENT;
  const elementByteLength = componentByteLength * elementSize;
  let componentCount = elementSize;

  let arrayView: AccessorTypedArray;

  if (accessor.bufferView !== undefined) {
    const buffer = accessor.bufferView.buffer.data;
    const byteOffset = accessor.byteOffset + accessor.bufferView.byteOffset;
    const byteStride = accessor.bufferView.byteStride;

    if (byteStride && byteStride !== elementByteLength) {
      arrayView = new arrConstructor(buffer, byteOffset, (elementCount * byteStride) / componentByteLength);

      if (deinterleave) {
        const interleavedArrayView = arrayView;
        const totalComponents = elementCount * elementSize;
        arrayView = new arrConstructor(totalComponents);
        componentCount = byteStride / componentByteLength;

        for (let i = 0; i < totalComponents; i++) {
          const index = Math.floor(i / elementSize) * componentCount + (i % elementSize);
          arrayView[i] = interleavedArrayView[index];
        }
      }
    } else {
      arrayView = new arrConstructor(buffer, byteOffset, elementCount * elementSize);
    }
  } else {
    arrayView = new arrConstructor(elementCount * elementSize);
  }

  const sparse = accessor.sparse;

  if (sparse) {
    arrayView = arrayView.slice();

    const { count, indicesBufferView, indicesByteOffset, indicesComponentType, valuesBufferView, valuesByteOffset } =
      sparse;

    const indicesBuffer = indicesBufferView.buffer.data;
    const indicesArrConstructor = AccessorComponentTypeToTypedArray[indicesComponentType];
    const indicesComponentByteLength = indicesArrConstructor.BYTES_PER_ELEMENT;
    const indicesComponentCount = indicesBufferView.byteStride
      ? indicesBufferView.byteStride / indicesComponentByteLength
      : 1;
    const indicesView = new indicesArrConstructor(
      indicesBuffer,
      indicesByteOffset + indicesBufferView.byteOffset,
      count * indicesComponentCount
    );

    const valuesBuffer = valuesBufferView.buffer.data;
    const valuesComponentCount = valuesBufferView.byteStride
      ? valuesBufferView.byteStride / componentByteLength
      : elementSize;
    const valuesView = new arrConstructor(
      valuesBuffer,
      valuesByteOffset + valuesBufferView.byteOffset,
      count * valuesComponentCount
    );

    for (let i = 0; i < count * elementSize; i++) {
      const elementIndex = Math.floor(i / elementSize);
      const componentIndex = i % elementSize;
      const indicesIndex = elementIndex * valuesComponentCount + componentIndex;
      const valuesIndex = elementIndex * indicesComponentCount + componentIndex;
      const baseIndex =
        Math.floor(indicesView[indicesIndex] / elementSize) * componentCount +
        (indicesView[indicesIndex] % elementSize);
      arrayView[baseIndex] = valuesView[valuesIndex];
    }
  }

  return arrayView;
}

// Modified version of gl-matrix's .transformMat4 for arrays of vec3s
// https://glmatrix.net/docs/module-vec3.html#.transformMat4
export function vec3ArrayTransformMat4(out: Float32Array, array: Float32Array, matrix: mat4): Float32Array {
  const count = array.length / 3;

  for (let i = 0; i < count; i++) {
    const x = array[i * 3];
    const y = array[i * 3 + 1];
    const z = array[i * 3 + 2];

    let w = matrix[3] * x + matrix[7] * y + matrix[11] * z + matrix[15];

    w = w || 1.0;

    out[i * 3] = (matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12]) / w;
    out[i * 3 + 1] = (matrix[1] * x + matrix[5] * y + matrix[9] * z + matrix[13]) / w;
    out[i * 3 + 2] = (matrix[2] * x + matrix[6] * y + matrix[10] * z + matrix[14]) / w;
  }

  return out;
}
