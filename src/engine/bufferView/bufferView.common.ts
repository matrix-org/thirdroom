import { BaseThreadContext } from "../module/module.common";
import { ResourceId } from "../resource/resource.common";

export const BufferViewResourceType = "buffer-view";

export enum BufferViewTarget {
  None = 0,
  ArrayBuffer = 34962,
  ElementArrayBuffer = 34963,
}

export interface BufferViewResourceProps {
  buffer: ArrayBuffer | SharedArrayBuffer;
  byteStride: number;
}

export interface LocalBufferView {
  buffer: ArrayBuffer | SharedArrayBuffer;
  byteStride: number;
}

export async function onLoadBufferView<ThreadContext extends BaseThreadContext>(
  ctx: ThreadContext,
  id: ResourceId,
  props: BufferViewResourceProps
): Promise<LocalBufferView> {
  return { ...props };
}
