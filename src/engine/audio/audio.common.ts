import { defineObjectBufferSchema, ObjectTripleBuffer } from "../allocator/ObjectBufferView";
import { ResourceId } from "../resource/resource.common";
import { AudioEmitterDistanceModel, AudioEmitterType } from "../resource/schema";

export enum AudioResourceType {
  AudioData = "audio-data",
  AudioSource = "audio-source",
  MediaStreamId = "media-stream-id",
  MediaStreamSource = "media-stream-source",
  AudioEmitter = "audio-emitter",
}

export type AudioResourceProps =
  | {
      bufferView: ResourceId;
      mimeType: string;
    }
  | { uri: string };

export interface SharedMediaStreamResource {
  streamId: string;
}

export const mediaStreamSourceSchema = defineObjectBufferSchema({
  stream: [Uint32Array, 1],
  gain: [Float32Array, 1],
});

export type MediaStreamSourceTripleBuffer = ObjectTripleBuffer<typeof mediaStreamSourceSchema>;

export const writeAudioSourceSchema = defineObjectBufferSchema({
  audio: [Uint32Array, 1],
  gain: [Float32Array, 1],
  seek: [Float32Array, 1],
  play: [Uint8Array, 1],
  playing: [Uint8Array, 1],
  loop: [Uint8Array, 1],
  playbackRate: [Float32Array, 1],
});

export const readAudioSourceSchema = defineObjectBufferSchema({
  currentTime: [Float32Array, 1],
  playing: [Uint8Array, 1],
  duration: [Float32Array, 1],
});

export type WriteAudioSourceTripleBuffer = ObjectTripleBuffer<typeof writeAudioSourceSchema>;
export type ReadAudioSourceTripleBuffer = ObjectTripleBuffer<typeof readAudioSourceSchema>;

export interface SharedAudioSourceResource {
  writeAudioSourceTripleBuffer: WriteAudioSourceTripleBuffer;
  readAudioSourceTripleBuffer: ReadAudioSourceTripleBuffer;
}

export const globalAudioEmitterSchema = defineObjectBufferSchema({
  sources: [Uint32Array, 16], // Note there can be a maximum 16 sources assigned to an emitter at any one time
  gain: [Float32Array, 1],
  output: [Uint32Array, 1],
});

export type GlobalAudioEmitterTripleBuffer = ObjectTripleBuffer<typeof globalAudioEmitterSchema>;

export const AudioEmitterDistanceModelMap: { [key: number]: DistanceModelType } = {
  [AudioEmitterDistanceModel.Linear]: "linear",
  [AudioEmitterDistanceModel.Inverse]: "inverse",
  [AudioEmitterDistanceModel.Exponential]: "exponential",
};

export const positionalAudioEmitterSchema = defineObjectBufferSchema({
  sources: [Uint32Array, 16], // Note there can be a maximum 16 sources assigned to an emitter at any one time
  gain: [Float32Array, 1],
  coneInnerAngle: [Float32Array, 1],
  coneOuterAngle: [Float32Array, 1],
  coneOuterGain: [Float32Array, 1],
  distanceModel: [Uint8Array, 1],
  maxDistance: [Float32Array, 1],
  refDistance: [Float32Array, 1],
  rolloffFactor: [Float32Array, 1],
  output: [Uint32Array, 1],
});

export type PositionalAudioEmitterTripleBuffer = ObjectTripleBuffer<typeof positionalAudioEmitterSchema>;

export interface SharedAudioEmitterResource {
  type: AudioEmitterType;
  emitterTripleBuffer: GlobalAudioEmitterTripleBuffer | PositionalAudioEmitterTripleBuffer;
}

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
