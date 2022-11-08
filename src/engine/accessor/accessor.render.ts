import { BufferAttribute, InterleavedBuffer, InterleavedBufferAttribute } from "three";

import { RenderThreadState } from "../renderer/renderer.render";
import { ResourceId } from "../resource/resource.common";
import { waitForLocalResource } from "../resource/resource.render";
import { LocalBufferView } from "../resource/schema";
import {
  AccessorComponentTypeToTypedArray,
  AccessorResourceProps,
  AccessorSparseIndicesArrayConstructor,
  AccessorTypedArray,
  AccessorTypedArrayConstructor,
  AccessorTypeToItemSize,
} from "./accessor.common";

export interface LocalAccessor {
  bufferView?: LocalBufferView;
  min?: number[];
  max?: number[];
  attribute: BufferAttribute | InterleavedBufferAttribute;
}

// Ported from https://github.com/mrdoob/three.js/blob/dev/examples/js/loaders/GLTFLoader.js#L2572
export async function onLoadLocalAccessorResource(
  ctx: RenderThreadState,
  id: ResourceId,
  props: AccessorResourceProps
): Promise<LocalAccessor> {
  const promises: Promise<LocalBufferView | undefined>[] = [];

  promises.push(
    props.bufferView ? waitForLocalResource<LocalBufferView>(ctx, props.bufferView) : Promise.resolve(undefined)
  );

  if (props.sparse) {
    promises.push(waitForLocalResource<LocalBufferView>(ctx, props.sparse.indices.bufferView));
    promises.push(waitForLocalResource<LocalBufferView>(ctx, props.sparse.values.bufferView));
  }

  const bufferViews = await Promise.all(promises);

  const bufferView = bufferViews[0];

  const itemSize = AccessorTypeToItemSize[props.type];
  const arrConstructor = AccessorComponentTypeToTypedArray[props.componentType] as AccessorTypedArrayConstructor;
  const itemBytes = itemSize * arrConstructor.BYTES_PER_ELEMENT;

  let attribute: BufferAttribute | InterleavedBufferAttribute;
  let array: AccessorTypedArray;

  if (bufferView && bufferView.byteStride && bufferView.byteStride !== itemBytes) {
    const interleavedBufferSlice = Math.floor(props.byteOffset / bufferView.byteStride);
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
      (props.byteOffset % bufferView.byteStride) / arrConstructor.BYTES_PER_ELEMENT,
      props.normalized
    );
  } else {
    if (bufferView) {
      array = new arrConstructor(
        bufferView.buffer.data,
        props.byteOffset + bufferView.byteOffset,
        props.count * itemSize
      );
    } else {
      array = new arrConstructor(props.count * itemSize);
    }

    attribute = new BufferAttribute(array, itemSize, props.normalized);
  }

  if (props.sparse) {
    const indicesBufferView = bufferViews[1]!;
    const indicesArrConstructor = AccessorComponentTypeToTypedArray[
      props.sparse.indices.componentType
    ] as AccessorSparseIndicesArrayConstructor;
    const indicesArr = new indicesArrConstructor(
      indicesBufferView.buffer.data,
      props.sparse.indices.byteOffset + (bufferView?.byteOffset || 0),
      props.sparse.count
    );

    const valuesBufferView = bufferViews[2]!;
    const valuesArr = new arrConstructor(
      valuesBufferView.buffer.data,
      props.sparse.values.byteOffset + (bufferView?.byteOffset || 0),
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
    bufferView,
    attribute,
    min: props.min,
    max: props.max,
  };
}
