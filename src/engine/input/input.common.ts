export enum InputMessageType {
  InitializeInputState = "initialize-input-state",
}

export interface InitializeInputStateMessage {
  inputRingBufferSab: SharedArrayBuffer;
}
