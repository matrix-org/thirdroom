import { GameState } from "../GameTypes";
import { Thread } from "../module/module.common";
import { createResource } from "../resource/resource.game";
import { BufferViewResourceProps, BufferViewResourceType } from "./bufferView.common";

export interface RemoteBufferView<T extends Thread> {
  thread: T;
  resourceId: number;
  buffer: SharedArrayBuffer;
  byteStride: number;
}

export function createRemoteBufferView<T extends Thread>(
  ctx: GameState,
  thread: T,
  buffer: SharedArrayBuffer,
  byteStride = 0
): RemoteBufferView<T> {
  const resourceId = createResource<BufferViewResourceProps>(ctx, thread, BufferViewResourceType, {
    buffer,
    byteStride,
  });

  return {
    thread,
    resourceId,
    byteStride,
    buffer,
  };
}
