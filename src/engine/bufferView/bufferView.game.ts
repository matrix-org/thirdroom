import { GameState } from "../GameTypes";
import { Thread } from "../module/module.common";
import { createResource } from "../resource/resource.game";
import { BufferViewResourceProps, BufferViewResourceType } from "./bufferView.common";

export interface RemoteBufferView<T extends Thread, B extends SharedArrayBuffer | undefined> {
  name: string;
  thread: T;
  resourceId: number;
  buffer: B;
  byteStride: number;
}

interface BufferViewProps<T extends Thread, B extends SharedArrayBuffer | ArrayBuffer> {
  name?: string;
  thread: T;
  buffer: B;
  byteStride?: number;
}

const DEFAULT_BUFFER_VIEW_NAME = "Buffer View";

export function createRemoteBufferView<T extends Thread, B extends SharedArrayBuffer | ArrayBuffer>(
  ctx: GameState,
  props: BufferViewProps<T, B>
): RemoteBufferView<T, B extends SharedArrayBuffer ? SharedArrayBuffer : undefined> {
  const name = props.name || DEFAULT_BUFFER_VIEW_NAME;
  const byteStride = props.byteStride || 0;

  const resourceId = createResource<BufferViewResourceProps>(
    ctx,
    props.thread,
    BufferViewResourceType,
    {
      buffer: props.buffer,
      byteStride,
    },
    {
      name,
    }
  );

  return {
    name,
    thread: props.thread,
    resourceId,
    byteStride,
    buffer: (props.buffer instanceof SharedArrayBuffer ? props.buffer : undefined) as B extends SharedArrayBuffer
      ? SharedArrayBuffer
      : undefined,
  };
}
