import { Message } from "../module/module.common";
import { TripleBufferBackedObjectBufferView } from "../allocator/ObjectBufferView";
import { worldMatrixObjectBufferSchema } from "../component/transform.common";

export enum AudioMessageType {
  InitializeAudioTransforms = "initialize-audio-transforms",
  PlayAudio = "play-audio",
  SetAudioListener = "set-audio-listener",
  SetAudioPeerEntity = "set-audio-peer-entity",
}

export interface PlayAudioMessage extends Message<AudioMessageType.PlayAudio> {
  filepath: string;
  eid: number;
}

export interface SetAudioListenerMessage extends Message<AudioMessageType.SetAudioListener> {
  eid: number;
}

export interface SetAudioPeerEntityMessage extends Message<AudioMessageType.SetAudioPeerEntity> {
  peerId: string;
  eid: number;
}

export interface InitializeAudioTransformsMessage {
  sharedAudioTransforms: SharedAudioTransforms;
}

export type SharedAudioTransforms = TripleBufferBackedObjectBufferView<
  typeof worldMatrixObjectBufferSchema,
  ArrayBuffer
>;
