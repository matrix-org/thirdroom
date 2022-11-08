import { BufferAttribute, InterleavedBuffer, InterleavedBufferAttribute } from "three";

import { GameState } from "../GameTypes";
import { Thread } from "../module/module.common";
import { addResourceRef, createResource, disposeResource } from "../resource/resource.game";
import { RemoteBufferView } from "../resource/schema";
import {
  AccessorComponentType,
  AccessorComponentTypeToTypedArray,
  AccessorResourceProps,
  AccessorResourceType,
  AccessorSparseIndicesArrayConstructor,
  AccessorSparseIndicesComponentType,
  AccessorType,
  AccessorTypedArray,
  AccessorTypedArrayConstructor,
  AccessorTypeToItemSize,
} from "./accessor.common";

export interface RemoteAccessor<S extends AccessorSparseProps | undefined> {
  name: string;
  resourceId: number;
  bufferView: RemoteBufferView | undefined;
  sparse: S extends AccessorSparseProps
    ? {
        indices: {
          bufferView: RemoteBufferView;
        };
        values: {
          bufferView: RemoteBufferView;
        };
      }
    : undefined;
  attribute: BufferAttribute | InterleavedBufferAttribute;
}

interface AccessorSparseIndicesProps {
  bufferView: RemoteBufferView;
  byteOffset?: number;
  componentType: AccessorSparseIndicesComponentType;
}

interface AccessorSparseValuesProps {
  bufferView: RemoteBufferView;
  byteOffset?: number;
}

interface AccessorSparseProps {
  count: number;
  indices: AccessorSparseIndicesProps;
  values: AccessorSparseValuesProps;
}

interface AccessorProps<S extends AccessorSparseProps | undefined> {
  name?: string;
  type: AccessorType;
  componentType: AccessorComponentType;
  bufferView: RemoteBufferView | undefined;
  count: number;
  byteOffset?: number;
  normalized?: boolean;
  min?: number[];
  max?: number[];
  sparse?: S;
}

const DEFAULT_ACCESSOR_NAME = "Accessor";

export function createRemoteAccessor<S extends AccessorSparseProps | undefined>(
  ctx: GameState,
  props: AccessorProps<S>
): RemoteAccessor<S> {
  const name = props.name || DEFAULT_ACCESSOR_NAME;

  if (props.bufferView) {
    addResourceRef(ctx, props.bufferView.resourceId);
  }

  if (props.sparse) {
    addResourceRef(ctx, props.sparse.indices.bufferView.resourceId);
    addResourceRef(ctx, props.sparse.values.bufferView.resourceId);
  }

  const resourceId = createResource<AccessorResourceProps>(
    ctx,
    Thread.Render,
    AccessorResourceType,
    {
      type: props.type,
      componentType: props.componentType,
      bufferView: props.bufferView ? props.bufferView.resourceId : undefined,
      count: props.count,
      byteOffset: props.byteOffset || 0,
      normalized: props.normalized || false,
      min: props.min,
      max: props.max,
      sparse: props.sparse
        ? {
            count: props.sparse.count,
            indices: {
              bufferView: props.sparse.indices.bufferView.resourceId,
              byteOffset: props.sparse.indices.byteOffset || 0,
              componentType: props.sparse.indices.componentType,
            },
            values: {
              bufferView: props.sparse.values.bufferView.resourceId,
              byteOffset: props.sparse.values.byteOffset || 0,
            },
          }
        : undefined,
    },
    {
      name,
      dispose() {
        if (props.bufferView) {
          disposeResource(ctx, props.bufferView.resourceId);
        }

        if (props.sparse) {
          disposeResource(ctx, props.sparse.indices.bufferView.resourceId);
          disposeResource(ctx, props.sparse.values.bufferView.resourceId);
        }
      },
    }
  );

  const bufferView = props.bufferView;

  const itemSize = AccessorTypeToItemSize[props.type];
  const arrConstructor = AccessorComponentTypeToTypedArray[props.componentType] as AccessorTypedArrayConstructor;
  const itemBytes = itemSize * arrConstructor.BYTES_PER_ELEMENT;

  let attribute: BufferAttribute | InterleavedBufferAttribute;
  let array: AccessorTypedArray;

  if (bufferView && bufferView.byteStride && bufferView.byteStride !== itemBytes) {
    const interleavedBufferSlice = Math.floor((props.byteOffset || 0) / bufferView.byteStride);
    array = new arrConstructor(
      bufferView.buffer.data,
      interleavedBufferSlice * bufferView.byteStride + bufferView.byteOffset,
      (props.count * bufferView.byteStride) / arrConstructor.BYTES_PER_ELEMENT
    );
    // TODO: Should we be caching these? https://github.com/mrdoob/three.js/blob/dev/examples/js/loaders/GLTFLoader.js#L2625
    const interleavedBuffer = new InterleavedBuffer(array, bufferView.byteStride / arrConstructor.BYTES_PER_ELEMENT);
    attribute = new InterleavedBufferAttribute(
      interleavedBuffer,
      itemSize,
      ((props.byteOffset || 0) % bufferView.byteStride) / arrConstructor.BYTES_PER_ELEMENT,
      props.normalized
    );

    if (array.byteLength > bufferView.byteLength) {
      throw new Error("Accessor extends beyond length of bufferView");
    }
  } else {
    if (bufferView) {
      array = new arrConstructor(
        bufferView.buffer.data,
        (props.byteOffset || 0) + bufferView.byteOffset,
        props.count * itemSize
      );

      if (array.byteLength > bufferView.byteLength) {
        throw new Error("Accessor extends beyond length of bufferView");
      }
    } else {
      array = new arrConstructor(props.count * itemSize);
    }

    attribute = new BufferAttribute(array, itemSize, props.normalized);
  }

  if (props.sparse) {
    const indicesBufferView = props.sparse.indices.bufferView;
    const indicesArrConstructor = AccessorComponentTypeToTypedArray[
      props.sparse.indices.componentType
    ] as AccessorSparseIndicesArrayConstructor;
    const indicesArr = new indicesArrConstructor(
      indicesBufferView.buffer.data,
      (props.sparse.indices.byteOffset || 0) + (bufferView?.byteOffset || 0),
      props.sparse.count
    );

    const valuesBufferView = props.sparse.values.bufferView;
    const valuesArr = new arrConstructor(
      valuesBufferView.buffer.data,
      (props.sparse.values.byteOffset || 0) + (bufferView?.byteOffset || 0),
      props.sparse.count * itemSize
    );

    if (bufferView) {
      // Don't modify the buffer view data. Only reuse the array if we created it above
      attribute = new BufferAttribute(array.slice(), itemSize, props.normalized);
    }

    for (let i = 0; i < indicesArr.length; i++) {
      const index = indicesArr[i];
      attribute.setX(index, valuesArr[i * itemSize]);
      if (itemSize >= 2) attribute.setY(index, valuesArr[i * itemSize + 1]);
      if (itemSize >= 3) attribute.setZ(index, valuesArr[i * itemSize + 2]);
      if (itemSize >= 4) attribute.setW(index, valuesArr[i * itemSize + 3]);
      if (itemSize >= 5) throw new Error("Unsupported itemSize in sparse THREE.BufferAttribute.");
    }
  }

  return {
    name,
    resourceId,
    attribute,
    bufferView: props.bufferView,
    sparse: props.sparse
      ? {
          indices: {
            bufferView: props.sparse.indices.bufferView,
          },
          values: {
            bufferView: props.sparse.values.bufferView,
          },
        }
      : undefined,
  } as RemoteAccessor<S>;
}
