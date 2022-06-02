import { InputRingBuffer } from "./RingBuffer";

export enum InputMessageType {
  InitializeInputState = "initialize-input-state",
}

export interface InitializeInputStateMessage {
  inputRingBuffer: InputRingBuffer<Float32ArrayConstructor>;
}
