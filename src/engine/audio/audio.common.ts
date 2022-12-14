import { defineObjectBufferSchema, ObjectTripleBuffer } from "../allocator/ObjectBufferView";

export const audioStateSchema = defineObjectBufferSchema({
  activeAudioListenerResourceId: [Uint32Array, 1],
  activeSceneResourceId: [Uint32Array, 1],
});

export type AudioStateTripleBuffer = ObjectTripleBuffer<typeof audioStateSchema>;

export enum AudioMessageType {
  InitializeAudioState = "initialize-audio-state",
}

export interface InitializeAudioStateMessage {
  audioStateTripleBuffer: AudioStateTripleBuffer;
}
