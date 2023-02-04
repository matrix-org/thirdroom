import { defineObjectBufferSchema, ObjectTripleBuffer } from "../allocator/ObjectBufferView";
import { AudioPlaybackRingBuffer } from "./AudioPlaybackRingBuffer";

export const FFT_BIN_SIZE = 2 ** 8;
export const FREQ_BIN_COUNT = FFT_BIN_SIZE / 2;

export enum AudioMessageType {
  InitializeAudioState = "initialize-audio-state",
}

export interface InitializeAudioStateMessage {
  audioPlaybackRingBuffer: AudioPlaybackRingBuffer;
  analyserTripleBuffer: AudioAnalyserTripleBuffer;
}

export const AudioAnalyserSchema = defineObjectBufferSchema({
  frequencyData: [Uint8Array, FREQ_BIN_COUNT],
  timeData: [Uint8Array, FREQ_BIN_COUNT],
});

export type AudioAnalyserTripleBuffer = ObjectTripleBuffer<typeof AudioAnalyserSchema>;
