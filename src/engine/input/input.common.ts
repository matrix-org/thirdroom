import { RingBuffer } from "../ringbuffer/RingBuffer";

export enum InputMessageType {
  InitializeInputState = "initialize-input-state",
}

export interface InitializeInputStateMessage {
  ringBuffer: RingBuffer<Float32ArrayConstructor>;
}
