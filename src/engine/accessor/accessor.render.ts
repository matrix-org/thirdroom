import { BufferAttribute, InterleavedBuffer, InterleavedBufferAttribute } from "three";

import { RenderThreadState } from "../renderer/renderer.render";
import { defineLocalResourceClass } from "../resource/LocalResourceClass";
import { AccessorResource } from "../resource/schema";
import { AccessorComponentTypeToTypedArray, AccessorTypeToElementSize, getAccessorArrayView } from "./accessor.common";

export class RendererAccessorResource extends defineLocalResourceClass<typeof AccessorResource, RenderThreadState>(
  AccessorResource
) {
  declare attribute: BufferAttribute | InterleavedBufferAttribute;

  async load(ctx: RenderThreadState) {
    const elementSize = AccessorTypeToElementSize[this.type];
    const arrConstructor = AccessorComponentTypeToTypedArray[this.componentType];
    const componentByteLength = arrConstructor.BYTES_PER_ELEMENT;
    const elementByteLength = componentByteLength * elementSize;

    if (this.bufferView && this.bufferView.byteStride && this.bufferView.byteStride !== elementByteLength) {
      const arrayView = getAccessorArrayView(this, false);
      const interleavedBuffer = new InterleavedBuffer(
        arrayView,
        this.bufferView.byteStride / arrayView.BYTES_PER_ELEMENT
      );
      this.attribute = new InterleavedBufferAttribute(interleavedBuffer, elementSize, 0, this.normalized);
    } else {
      this.attribute = new BufferAttribute(getAccessorArrayView(this), elementSize, this.normalized);
    }
  }
}
