import { defineObjectBufferSchema, TripleBufferBackedObjectBufferView } from "../allocator/ObjectBufferView";
import { ResourceId } from "../resource/resource.common";

export const AudioResourceType = "audio";
export const AudioSourceResourceType = "audio-source";
export const MediaStreamSourceResourceType = "media-stream-source";
export const GlobalAudioEmitterResourceType = "global-audio-emitter";
export const PositionalAudioEmitterResourceType = "positional-audio-emitter";

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

export type SharedMediaStreamSource = TripleBufferBackedObjectBufferView<typeof mediaStreamSourceSchema, ArrayBuffer>;

export interface SharedMediaStreamSourceResource {
  initialProps: MediaStreamSourceProps;
  sharedMediaStreamSource: SharedMediaStreamSource;
}

export interface AudioSourceResourceProps {
  audio: ResourceId;
  gain: number;
  autoPlay: boolean;
  loop: boolean;
  currentTime: number;
}

export const audioSourceSchema = defineObjectBufferSchema({
  audio: [Uint32Array, 1],
  gain: [Float32Array, 1],
  currentTime: [Float32Array, 1],
  playing: [Uint8Array, 1],
  loop: [Uint8Array, 1],
});

export type SharedAudioSource = TripleBufferBackedObjectBufferView<typeof audioSourceSchema, ArrayBuffer>;

export interface SharedAudioSoruceResource {
  initialProps: AudioSourceResourceProps;
  sharedAudioSource: SharedAudioSource;
}

export interface GlobalAudioEmitterResourceProps {
  sources: ResourceId[];
  gain: number;
}

export const globalAudioEmitterSchema = defineObjectBufferSchema({
  sources: [Uint32Array, 16], // Note there can be a maximum 16 sources assigned to an emitter at any one time
  gain: [Float32Array, 1],
});

export type SharedGlobalAudioEmitter = TripleBufferBackedObjectBufferView<typeof globalAudioEmitterSchema, ArrayBuffer>;

export interface SharedGlobalAudioEmitterResource {
  initialProps: GlobalAudioEmitterResourceProps;
  sharedGlobalAudioEmitter: SharedGlobalAudioEmitter;
}

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

export interface PositionalAudioEmitterResourceProps {
  sources: ResourceId[];
  gain: number;
  coneInnerAngle: number;
  coneOuterAngle: number;
  coneOuterGain: number;
  distanceModel: AudioEmitterDistanceModel;
  maxDistance: number;
  refDistance: number;
  rolloffFactor: number;
}

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

export type SharedPositionalAudioEmitter = TripleBufferBackedObjectBufferView<
  typeof positionalAudioEmitterSchema,
  ArrayBuffer
>;

export interface SharedPositionalAudioEmitterResource {
  initialProps: PositionalAudioEmitterResourceProps;
  sharedPositionalAudioEmitter: SharedPositionalAudioEmitter;
}

export const audioStateSchema = defineObjectBufferSchema({
  activeAudioListenerResourceId: [Uint32Array, 1],
  activeSceneResourceId: [Uint32Array, 1],
});

export type SharedAudioState = TripleBufferBackedObjectBufferView<typeof audioStateSchema, ArrayBuffer>;

export enum AudioMessageType {
  InitializeAudioState = "initialize-audio-state",
}

export interface InitializeAudioStateMessage {
  sharedAudioState: SharedAudioState;
}
