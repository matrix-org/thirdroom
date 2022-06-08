import { GameState } from "../GameTypes";
import { Thread } from "../module/module.common";
import { createResource } from "../resource/resource.game";
import { BufferViewResourceProps, BufferViewResourceType } from "./bufferView.common";

export interface RemoteBufferView<T extends Thread> {
  thread: T;
  resourceId: number;
}

export interface RemoteSharedBufferView<T extends Thread> extends RemoteBufferView<T> {
  buffer: SharedArrayBuffer;
}

export function createRemoteBufferView<T extends Thread>(
  ctx: GameState,
  thread: T,
  buffer: ArrayBuffer,
  byteStride?: number
): RemoteBufferView<T> {
  return {
    thread,
    resourceId: createResource<BufferViewResourceProps>(
      ctx,
      thread,
      BufferViewResourceType,
      { buffer, byteStride: byteStride || 0 },
      [buffer]
    ),
  };
}

export function createRemoteSharedBufferView<T extends Thread>(
  ctx: GameState,
  thread: T,
  buffer: SharedArrayBuffer,
  byteStride?: number
): RemoteSharedBufferView<T> {
  const resourceId = createResource<BufferViewResourceProps>(ctx, thread, BufferViewResourceType, {
    buffer,
    byteStride: byteStride || 0,
  });

  return {
    thread,
    resourceId,
    buffer,
  };
}
