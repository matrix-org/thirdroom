import { GameState } from "../GameTypes";
import { Thread } from "../module/module.common";
import { createResource } from "../resource/resource.game";
import { BufferViewResourceProps, BufferViewResourceType } from "./bufferView.common";

export interface RemoteBufferView<T extends Thread> {
  thread: T;
  resourceId: number;
  buffer: ArrayBuffer;
  byteStride: number;
}

export function createRemoteBufferView<T extends Thread>(
  ctx: GameState,
  thread: T,
  buffer: ArrayBuffer,
  byteStride = 0
): RemoteBufferView<T> {
  const resourceId = createResource<BufferViewResourceProps>(
    ctx,
    thread,
    BufferViewResourceType,
    {
      buffer,
      byteStride,
    },
    [buffer]
  );

  return {
    thread,
    resourceId,
    byteStride,
    buffer,
  };
}
