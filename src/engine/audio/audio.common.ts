import { AudioPlaybackRingBuffer } from "./AudioPlaybackRingBuffer";

export enum AudioMessageType {
  InitializeAudioState = "initialize-audio-state",
}

export interface InitializeAudioStateMessage {
  audioPlaybackRingBuffer: AudioPlaybackRingBuffer;
}
