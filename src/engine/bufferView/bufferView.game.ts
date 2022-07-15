import { GameState } from "../GameTypes";
import { Thread } from "../module/module.common";
import { Resource } from "../resource/resource.game";
import { BufferViewResourceProps, BufferViewResourceType } from "./bufferView.common";

interface BufferViewProps<T extends Thread.Main | Thread.Render, B extends SharedArrayBuffer | ArrayBuffer> {
  name?: string;
  thread: T;
  buffer: B;
  byteStride?: number;
}

type RemoteBuffer<B extends SharedArrayBuffer | ArrayBuffer> = B extends SharedArrayBuffer
  ? SharedArrayBuffer
  : undefined;

export class BufferView<
  T extends Thread.Main | Thread.Render,
  B extends SharedArrayBuffer | ArrayBuffer
> extends Resource {
  public readonly byteStride: number;
  public readonly buffer: RemoteBuffer<B>;
  public readonly thread: T;

  constructor(ctx: GameState, props: BufferViewProps<T, B>) {
    super(ctx, BufferViewResourceType, props.name);

    this.byteStride = props.byteStride || 0;
    this.buffer = (props.buffer instanceof SharedArrayBuffer ? props.buffer : undefined) as RemoteBuffer<B>;
    this.thread = props.thread;

    this.createThreadResource<BufferViewResourceProps>(props.thread, {
      buffer: props.buffer,
      byteStride: this.byteStride,
    });
  }
}
