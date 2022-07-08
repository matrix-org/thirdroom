import { GameState } from "../GameTypes";
import { Thread } from "../module/module.common";
import { createResource } from "../resource/resource.game";
import { BufferViewResourceProps, BufferViewResourceType } from "./bufferView.common";

export interface RemoteBufferView<T extends Thread> {
  name: string;
  thread: T;
  resourceId: number;
  buffer: ArrayBuffer;
  byteStride: number;
}

interface BufferViewProps<T extends Thread> {
  name?: string;
  thread: T;
  buffer: ArrayBuffer;
  byteStride?: number;
}

const DEFAULT_BUFFER_VIEW_NAME = "Buffer View";

export function createRemoteBufferView<T extends Thread>(
  ctx: GameState,
  props: BufferViewProps<T>
): RemoteBufferView<T> {
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
      transferList: [props.buffer],
    }
  );

  return {
    name,
    thread: props.thread,
    resourceId,
    byteStride,
    buffer: props.buffer,
  };
}
