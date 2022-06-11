import { defineObjectBufferSchema, ObjectTripleBuffer } from "../allocator/ObjectBufferView";
import { ResourceId } from "../resource/resource.common";

export enum AudioResourceType {
  AudioData = "audio-data",
  AudioSource = "audio-source",
  MediaStreamSource = "media-stream-source",
  GlobalAudioEmitter = "global-audio-emitter",
  PositionalAudioEmitter = "positional-audio-emitter",
}

export type AudioResourceProps =
  | {
      bufferView: ResourceId;
      mimeType: string;
    }
  | { uri: string };

export interface MediaStreamSourceProps {
  streamId: number;
  gain: number;
}

export const mediaStreamSourceSchema = defineObjectBufferSchema({
  streamId: [Uint32Array, 1],
  gain: [Float32Array, 1],
});

export type SharedMediaStreamSource = ObjectTripleBuffer<typeof mediaStreamSourceSchema>;

// export interface SharedMediaStreamSourceResource {
//   initialProps: MediaStreamSourceProps;
//   sharedMediaStreamSource: SharedMediaStreamSource;
// }

export interface AudioSourceResourceProps {
  resourceId: ResourceId;
  gain: number;
  autoPlay: boolean;
  loop: boolean;
  currentTime: number;
}

export const audioSourceWriteSchema = defineObjectBufferSchema({
  audio: [Uint32Array, 1],
  gain: [Float32Array, 1],
  currentTime: [Float32Array, 1],
  playing: [Uint8Array, 1],
  loop: [Uint8Array, 1],
});

export const audioSourceReadSchema = defineObjectBufferSchema({
  currentTime: [Float32Array, 1],
  playing: [Uint8Array, 1],
  duration: [Float32Array, 1],
});

export type SharedWriteAudioSource = ObjectTripleBuffer<typeof audioSourceWriteSchema>;
export type SharedReadAudioSource = ObjectTripleBuffer<typeof audioSourceReadSchema>;

export interface SharedAudioSourceResource {
  sharedWriteAudioSource: SharedWriteAudioSource;
  sharedReadAudioSource: SharedReadAudioSource;
}

export interface GlobalAudioEmitterResourceProps {
  sources: ResourceId[];
  gain: number;
}

export const globalAudioEmitterSchema = defineObjectBufferSchema({
  sources: [Uint32Array, 16], // Note there can be a maximum 16 sources assigned to an emitter at any one time
  gain: [Float32Array, 1],
});

export type SharedGlobalAudioEmitter = ObjectTripleBuffer<typeof globalAudioEmitterSchema>;

// export interface SharedGlobalAudioEmitterResource {
//   initialProps: GlobalAudioEmitterResourceProps;
//   sharedGlobalAudioEmitter: SharedGlobalAudioEmitter;
// }

export enum AudioEmitterDistanceModel {
  Linear,
  Inverse,
  Exponential,
}

export const AudioEmitterDistanceModelMap: { [key: number]: DistanceModelType } = {
  [AudioEmitterDistanceModel.Linear]: "linear",
  [AudioEmitterDistanceModel.Inverse]: "inverse",
  [AudioEmitterDistanceModel.Exponential]: "exponential",
};

// export interface PositionalAudioEmitterResourceProps {
//   sources: ResourceId[];
//   gain: number;
//   coneInnerAngle: number;
//   coneOuterAngle: number;
//   coneOuterGain: number;
//   distanceModel: AudioEmitterDistanceModel;
//   maxDistance: number;
//   refDistance: number;
//   rolloffFactor: number;
// }

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
});

export type SharedPositionalAudioEmitter = ObjectTripleBuffer<typeof positionalAudioEmitterSchema>;

// export interface SharedPositionalAudioEmitterResource {
//   sharedPositionalAudioEmitter: SharedPositionalAudioEmitter;
// }

export const audioStateSchema = defineObjectBufferSchema({
  activeAudioListenerResourceId: [Uint32Array, 1],
  activeSceneResourceId: [Uint32Array, 1],
});

export type SharedAudioState = ObjectTripleBuffer<typeof audioStateSchema>;

export enum AudioMessageType {
  InitializeAudioState = "initialize-audio-state",
}

export interface InitializeAudioStateMessage {
  sharedAudioState: SharedAudioState;
}
