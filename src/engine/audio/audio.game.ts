import { GameState } from "../GameTypes";
import { defineModule, getModule, Thread } from "../module/module.common";
import {
  AudioEmitterDistanceModel,
  AudioMessageType,
  AudioResourceProps,
  audioStateSchema,
  globalAudioEmitterSchema,
  InitializeAudioStateMessage,
  mediaStreamSourceSchema,
  AudioResourceType,
  positionalAudioEmitterSchema,
  AudioStateTripleBuffer,
  GlobalAudioEmitterTripleBuffer,
  MediaStreamSourceTripleBuffer,
  PositionalAudioEmitterTripleBuffer,
  readAudioSourceSchema,
  writeAudioSourceSchema,
  WriteAudioSourceTripleBuffer,
  ReadAudioSourceTripleBuffer,
  SharedAudioSourceResource,
  SharedMediaStreamResource,
  SharedAudioEmitterResource,
  AudioEmitterType,
  AudioEmitterOutput,
} from "./audio.common";
import {
  commitToObjectTripleBuffer,
  createObjectBufferView,
  createObjectTripleBuffer,
  ObjectBufferView,
} from "../allocator/ObjectBufferView";
import { ResourceId } from "../resource/resource.common";
import { createResource } from "../resource/resource.game";
import { RemoteBufferView } from "../bufferView/bufferView.game";
import { RemoteScene, updateAudioRemoteScenes } from "../scene/scene.game";
import { RemoteNode, RemoteNodeComponent } from "../node/node.game";

interface GameAudioModuleState {
  audioStateBufferView: ObjectBufferView<typeof audioStateSchema, ArrayBuffer>;
  audioStateTripleBuffer: AudioStateTripleBuffer;
  activeScene?: RemoteScene;
  activeAudioListener?: RemoteNode;
  audioDatum: RemoteAudioData[];
  audioSources: RemoteAudioSource[];
  mediaStreamSources: RemoteMediaStreamSource[];
  globalAudioEmitters: RemoteGlobalAudioEmitter[];
  positionalAudioEmitters: RemotePositionalAudioEmitter[];
  scenes: RemoteScene[];
}

export const GameAudioModule = defineModule<GameState, GameAudioModuleState>({
  name: "audio",
  async create({ gameToRenderTripleBufferFlags }, { sendMessage }) {
    const audioStateBufferView = createObjectBufferView(audioStateSchema, ArrayBuffer);
    const audioStateTripleBuffer = createObjectTripleBuffer(audioStateSchema, gameToRenderTripleBufferFlags);

    sendMessage<InitializeAudioStateMessage>(Thread.Main, AudioMessageType.InitializeAudioState, {
      audioStateTripleBuffer,
    });

    return {
      audioStateBufferView,
      audioStateTripleBuffer,
      audioDatum: [],
      audioSources: [],
      mediaStreamSources: [],
      globalAudioEmitters: [],
      positionalAudioEmitters: [],
      scenes: [],
    };
  },
  init() {},
});

/**
 * API
 */

export interface RemoteAudioData {
  resourceId: number;
  uri?: string;
  bufferView?: RemoteBufferView<Thread.Main>;
}

export function createRemoteAudioFromBufferView(
  ctx: GameState,
  bufferView: RemoteBufferView<Thread.Main>,
  mimeType: string
): RemoteAudioData {
  return {
    resourceId: createResource<AudioResourceProps>(ctx, Thread.Main, AudioResourceType.AudioSource, {
      bufferView: bufferView.resourceId,
      mimeType,
    }),
    bufferView,
  };
}

export function createRemoteAudio(ctx: GameState, uri: string): RemoteAudioData {
  return {
    resourceId: createResource<AudioResourceProps>(ctx, Thread.Main, AudioResourceType.AudioSource, {
      uri,
    }),
  };
}

export interface RemoteAudioSource {
  resourceId: number;
  audioSourceWriteBuffer: ObjectBufferView<typeof writeAudioSourceSchema, ArrayBuffer>;
  audioSourceReadBuffer: ObjectBufferView<typeof readAudioSourceSchema, ArrayBuffer>;
  sharedWriteAudioSource: WriteAudioSourceTripleBuffer;
  sharedReadAudioSource: ReadAudioSourceTripleBuffer;
  get audio(): RemoteAudioData | undefined;
  set audio(value: RemoteAudioData | undefined);
  get gain(): number;
  set gain(value: number);
  get playbackRate(): number;
  set playbackRate(value: number);
  get currentTime(): number;
  set currentTime(value: number);
  get duration(): number;
  get playing(): boolean;
  set playing(value: boolean);
  get loop(): boolean;
  set loop(value: boolean);
}

export interface AudioSourceProps {
  audio?: RemoteAudioData;
  gain?: number;
  playbackRate?: number;
  startTime?: number;
  autoPlay?: boolean;
  loop?: boolean;
}

export function createRemoteAudioSource(ctx: GameState, props?: AudioSourceProps): RemoteAudioSource {
  const audioModule = getModule(ctx, GameAudioModule);

  const audioSourceWriteBuffer = createObjectBufferView(writeAudioSourceSchema, ArrayBuffer);

  audioSourceWriteBuffer.play[0] = props?.autoPlay === undefined || props.autoPlay ? 1 : 0;
  audioSourceWriteBuffer.audio[0] = props?.audio ? props.audio.resourceId : 0;
  audioSourceWriteBuffer.gain[0] = props?.gain === undefined ? 1 : props.gain;
  audioSourceWriteBuffer.playbackRate[0] = props?.playbackRate === undefined ? 1 : props.playbackRate;
  audioSourceWriteBuffer.playing[0] = props?.autoPlay === undefined || props.autoPlay ? 1 : 0;
  audioSourceWriteBuffer.loop[0] = props?.loop === undefined || props.loop ? 1 : 0;
  audioSourceWriteBuffer.seek[0] = props?.startTime === undefined ? 0 : props.startTime;

  const sharedWriteAudioSource = createObjectTripleBuffer(writeAudioSourceSchema, ctx.gameToMainTripleBufferFlags);

  const audioSourceReadBuffer = createObjectBufferView(readAudioSourceSchema, ArrayBuffer);

  const sharedReadAudioSource = createObjectTripleBuffer(readAudioSourceSchema, ctx.mainToGameTripleBufferFlags);

  const resourceId = createResource<SharedAudioSourceResource>(ctx, Thread.Main, AudioResourceType.AudioSource, {
    writeAudioSourceTripleBuffer: sharedWriteAudioSource,
    readAudioSourceTripleBuffer: sharedReadAudioSource,
  });

  let _audio: RemoteAudioData | undefined = props?.audio;

  const remoteAudioSource: RemoteAudioSource = {
    resourceId,
    audioSourceWriteBuffer,
    audioSourceReadBuffer,
    sharedWriteAudioSource,
    sharedReadAudioSource,
    get audio(): RemoteAudioData | undefined {
      return _audio;
    },
    set audio(value: RemoteAudioData | undefined) {
      _audio = value;
      audioSourceWriteBuffer.audio[0] = value ? value.resourceId : 0;
    },
    get gain(): number {
      return audioSourceWriteBuffer.gain[0];
    },
    set gain(value: number) {
      audioSourceWriteBuffer.gain[0] = value;
    },
    get playbackRate(): number {
      return audioSourceWriteBuffer.playbackRate[0];
    },
    set playbackRate(value: number) {
      audioSourceWriteBuffer.playbackRate[0] = value;
    },
    get currentTime(): number {
      return audioSourceReadBuffer.currentTime[0];
    },
    set currentTime(value: number) {
      audioSourceWriteBuffer.seek[0] = value;
    },
    get duration(): number {
      return audioSourceReadBuffer.duration[0];
    },
    get playing(): boolean {
      return !!audioSourceReadBuffer.playing[0];
    },
    set playing(value: boolean) {
      audioSourceWriteBuffer.playing[0] = value ? 1 : 0;
    },
    get loop(): boolean {
      return !!audioSourceWriteBuffer.loop[0];
    },
    set loop(value: boolean) {
      audioSourceWriteBuffer.loop[0] = value ? 1 : 0;
    },
  };

  audioModule.audioSources.push(remoteAudioSource);

  return remoteAudioSource;
}

interface RemoteMediaStream {
  resourceId: ResourceId;
}

export function createRemoteMediaStream(ctx: GameState, streamId: string): RemoteMediaStream {
  return {
    resourceId: createResource<SharedMediaStreamResource>(ctx, Thread.Main, AudioResourceType.MediaStreamSource, {
      streamId,
    }),
  };
}

export interface RemoteMediaStreamSource {
  resourceId: number;
  mediaStreamSourceBuffer: ObjectBufferView<typeof mediaStreamSourceSchema, ArrayBuffer>;
  sharedMediaStreamSource: MediaStreamSourceTripleBuffer;
  get stream(): RemoteMediaStream | undefined;
  set stream(value: RemoteMediaStream | undefined);
  get gain(): number;
  set gain(value: number);
}

export interface MediaStreamSourceProps {
  stream?: RemoteMediaStream;
  gain?: number;
}

export function createRemoteMediaStreamSource(ctx: GameState, props?: MediaStreamSourceProps): RemoteMediaStreamSource {
  const audioModule = getModule(ctx, GameAudioModule);

  const mediaStreamSourceBuffer = createObjectBufferView(mediaStreamSourceSchema, ArrayBuffer);

  mediaStreamSourceBuffer.stream[0] = props?.stream?.resourceId || 0;
  mediaStreamSourceBuffer.gain[0] = props?.gain === undefined ? 1 : props.gain;

  const sharedMediaStreamSource = createObjectTripleBuffer(mediaStreamSourceSchema, ctx.gameToMainTripleBufferFlags);

  const resourceId = createResource<MediaStreamSourceTripleBuffer>(
    ctx,
    Thread.Main,
    AudioResourceType.MediaStreamSource,
    sharedMediaStreamSource
  );

  let _stream: RemoteMediaStream | undefined = props?.stream || undefined;

  const remoteMediaStreamSource: RemoteMediaStreamSource = {
    resourceId,
    mediaStreamSourceBuffer,
    sharedMediaStreamSource,
    get stream(): RemoteMediaStream | undefined {
      return _stream;
    },
    set stream(value: RemoteMediaStream | undefined) {
      _stream = value;
      mediaStreamSourceBuffer.stream[0] = value?.resourceId || 0;
    },
    get gain(): number {
      return mediaStreamSourceBuffer.gain[0];
    },
    set gain(value: number) {
      mediaStreamSourceBuffer.gain[0] = value;
    },
  };

  audioModule.mediaStreamSources.push(remoteMediaStreamSource);

  return remoteMediaStreamSource;
}

export type RemoteEmitterSource = RemoteAudioSource | RemoteMediaStreamSource;

export interface RemoteGlobalAudioEmitter {
  type: AudioEmitterType.Global;
  resourceId: ResourceId;
  globalAudioEmitterBuffer: ObjectBufferView<typeof globalAudioEmitterSchema, ArrayBuffer>;
  sharedGlobalAudioEmitter: GlobalAudioEmitterTripleBuffer;
  get sources(): RemoteEmitterSource[];
  set sources(sources: RemoteEmitterSource[]);
  get gain(): number;
  set gain(value: number);
  get output(): AudioEmitterOutput;
  set output(value: AudioEmitterOutput);
}

export interface GlobalAudioEmitterProps {
  sources?: RemoteEmitterSource[];
  gain?: number;
  output?: AudioEmitterOutput;
}

export function createRemoteGlobalAudioEmitter(
  ctx: GameState,
  props?: GlobalAudioEmitterProps
): RemoteGlobalAudioEmitter {
  const audioModule = getModule(ctx, GameAudioModule);

  const globalAudioEmitterBuffer = createObjectBufferView(globalAudioEmitterSchema, ArrayBuffer);

  globalAudioEmitterBuffer.sources.set(props?.sources ? props.sources.map((source) => source.resourceId) : []);
  globalAudioEmitterBuffer.gain[0] = props?.gain === undefined ? 1 : props.gain;
  globalAudioEmitterBuffer.output[0] = props?.output === undefined ? AudioEmitterOutput.Environment : props.output;

  const sharedGlobalAudioEmitter = createObjectTripleBuffer(globalAudioEmitterSchema, ctx.gameToMainTripleBufferFlags);

  const resourceId = createResource<SharedAudioEmitterResource>(ctx, Thread.Main, AudioResourceType.AudioEmitter, {
    type: AudioEmitterType.Global,
    emitterTripleBuffer: sharedGlobalAudioEmitter,
  });

  let _sources: RemoteEmitterSource[] = props?.sources || [];

  const remoteGlobalAudioEmitter: RemoteGlobalAudioEmitter = {
    type: AudioEmitterType.Global,
    resourceId,
    globalAudioEmitterBuffer,
    sharedGlobalAudioEmitter,
    get sources(): RemoteEmitterSource[] {
      // TODO: Use a proxy to check for array mutation?
      return _sources;
    },
    set sources(value: RemoteEmitterSource[]) {
      _sources = value;
      globalAudioEmitterBuffer.sources.set(_sources.map((source) => source.resourceId));
    },
    get gain(): number {
      return globalAudioEmitterBuffer.gain[0];
    },
    set gain(value: number) {
      globalAudioEmitterBuffer.gain[0] = value;
    },
    get output(): AudioEmitterOutput {
      return globalAudioEmitterBuffer.output[0];
    },
    set output(value: AudioEmitterOutput) {
      globalAudioEmitterBuffer.output[0] = value;
    },
  };

  audioModule.globalAudioEmitters.push(remoteGlobalAudioEmitter);

  return remoteGlobalAudioEmitter;
}

export interface RemotePositionalAudioEmitter {
  type: AudioEmitterType.Positional;
  resourceId: ResourceId;
  positionalAudioEmitterBuffer: ObjectBufferView<typeof positionalAudioEmitterSchema, ArrayBuffer>;
  sharedPositionalAudioEmitter: PositionalAudioEmitterTripleBuffer;
  get sources(): RemoteEmitterSource[];
  set sources(sources: RemoteEmitterSource[]);
  get gain(): number;
  set gain(value: number);
  get coneInnerAngle(): number;
  set coneInnerAngle(value: number);
  get coneOuterAngle(): number;
  set coneOuterAngle(value: number);
  get distanceModel(): AudioEmitterDistanceModel;
  set distanceModel(value: AudioEmitterDistanceModel);
  get maxDistance(): number;
  set maxDistance(value: number);
  get refDistance(): number;
  set refDistance(value: number);
  get rolloffFactor(): number;
  set rolloffFactor(value: number);
  get output(): AudioEmitterOutput;
  set output(value: AudioEmitterOutput);
}

export interface PositionalAudioEmitterProps {
  sources?: RemoteEmitterSource[];
  gain?: number;
  coneInnerAngle?: number;
  coneOuterAngle?: number;
  coneOuterGain?: number;
  distanceModel?: AudioEmitterDistanceModel;
  maxDistance?: number;
  refDistance?: number;
  rolloffFactor?: number;
  output?: AudioEmitterOutput;
}

export type RemoteAudioEmitter = RemoteGlobalAudioEmitter | RemotePositionalAudioEmitter;

export function createRemotePositionalAudioEmitter(
  ctx: GameState,
  props: PositionalAudioEmitterProps
): RemotePositionalAudioEmitter {
  const audioModule = getModule(ctx, GameAudioModule);

  const positionalAudioEmitterBuffer = createObjectBufferView(positionalAudioEmitterSchema, ArrayBuffer);

  positionalAudioEmitterBuffer.sources.set(props?.sources ? props.sources.map((source) => source.resourceId) : []);
  positionalAudioEmitterBuffer.gain[0] = props?.gain === undefined ? 1 : props.gain;
  positionalAudioEmitterBuffer.coneInnerAngle[0] =
    props?.coneInnerAngle === undefined ? Math.PI * 2 : props.coneInnerAngle;
  positionalAudioEmitterBuffer.coneOuterAngle[0] =
    props?.coneOuterAngle === undefined ? Math.PI * 2 : props.coneOuterAngle;
  positionalAudioEmitterBuffer.coneOuterGain[0] = props?.coneOuterGain === undefined ? 0 : props.coneOuterGain;
  positionalAudioEmitterBuffer.distanceModel[0] =
    props?.distanceModel === undefined ? AudioEmitterDistanceModel.Inverse : props.distanceModel;
  positionalAudioEmitterBuffer.maxDistance[0] = props?.maxDistance === undefined ? 10000 : props.maxDistance;
  positionalAudioEmitterBuffer.refDistance[0] = props?.refDistance === undefined ? 1 : props.refDistance;
  positionalAudioEmitterBuffer.rolloffFactor[0] = props?.rolloffFactor === undefined ? 1 : props.rolloffFactor;
  positionalAudioEmitterBuffer.output[0] = props?.output === undefined ? AudioEmitterOutput.Environment : props.output;

  // TODO: Initialize world matrix when adding component

  const sharedPositionalAudioEmitter = createObjectTripleBuffer(
    positionalAudioEmitterSchema,
    ctx.gameToMainTripleBufferFlags
  );

  const resourceId = createResource<SharedAudioEmitterResource>(ctx, Thread.Main, AudioResourceType.AudioEmitter, {
    type: AudioEmitterType.Positional,
    emitterTripleBuffer: sharedPositionalAudioEmitter,
  });

  let _sources: RemoteEmitterSource[] = props?.sources || [];

  const remotePositionalAudioEmitter: RemotePositionalAudioEmitter = {
    type: AudioEmitterType.Positional,
    resourceId,
    positionalAudioEmitterBuffer,
    sharedPositionalAudioEmitter,
    get sources(): RemoteEmitterSource[] {
      // TODO: Use a proxy to check for array mutation?
      return _sources;
    },
    set sources(value: RemoteEmitterSource[]) {
      _sources = value;
      positionalAudioEmitterBuffer.sources.set(_sources.map((source) => source.resourceId));
    },
    get gain(): number {
      return positionalAudioEmitterBuffer.gain[0];
    },
    set gain(value: number) {
      positionalAudioEmitterBuffer.gain[0] = value;
    },
    get coneInnerAngle(): number {
      return positionalAudioEmitterBuffer.coneInnerAngle[0];
    },
    set coneInnerAngle(value: number) {
      positionalAudioEmitterBuffer.coneInnerAngle[0] = value;
    },
    get coneOuterAngle(): number {
      return positionalAudioEmitterBuffer.coneOuterAngle[0];
    },
    set coneOuterAngle(value: number) {
      positionalAudioEmitterBuffer.coneOuterAngle[0] = value;
    },
    get distanceModel(): AudioEmitterDistanceModel {
      return positionalAudioEmitterBuffer.distanceModel[0];
    },
    set distanceModel(value: AudioEmitterDistanceModel) {
      positionalAudioEmitterBuffer.distanceModel[0] = value;
    },
    get maxDistance(): number {
      return positionalAudioEmitterBuffer.maxDistance[0];
    },
    set maxDistance(value: number) {
      positionalAudioEmitterBuffer.maxDistance[0] = value;
    },
    get refDistance(): number {
      return positionalAudioEmitterBuffer.refDistance[0];
    },
    set refDistance(value: number) {
      positionalAudioEmitterBuffer.refDistance[0] = value;
    },
    get rolloffFactor(): number {
      return positionalAudioEmitterBuffer.rolloffFactor[0];
    },
    set rolloffFactor(value: number) {
      positionalAudioEmitterBuffer.rolloffFactor[0] = value;
    },
    get output(): AudioEmitterOutput {
      return positionalAudioEmitterBuffer.output[0];
    },
    set output(value: AudioEmitterOutput) {
      positionalAudioEmitterBuffer.output[0] = value;
    },
  };

  audioModule.positionalAudioEmitters.push(remotePositionalAudioEmitter);

  return remotePositionalAudioEmitter;
}

export interface PlayAudioOptions {
  gain?: number;
  startTime?: number;
  loop?: boolean;
  playbackRate?: number;
}

export function playAudio(audioSource: RemoteAudioSource, audioData?: RemoteAudioData, options?: PlayAudioOptions) {
  if (audioData !== undefined) {
    audioSource.audio = audioData;
  }

  audioSource.audioSourceWriteBuffer.play[0] = 1;
  audioSource.playing = true;
  audioSource.loop = false;
  audioSource.currentTime = 0;
  audioSource.playbackRate = 1;
  Object.assign(audioSource, options);
}

export function setActiveAudioListener(ctx: GameState, eid: number) {
  const audioModule = getModule(ctx, GameAudioModule);
  const remoteNode = RemoteNodeComponent.get(eid);
  audioModule.activeAudioListener = remoteNode;
}

/**
 * Systems
 */

export function GameAudioSystem(ctx: GameState) {
  const audioModule = getModule(ctx, GameAudioModule);

  audioModule.audioStateBufferView.activeAudioListenerResourceId[0] =
    audioModule.activeAudioListener?.audioResourceId || 0;
  audioModule.audioStateBufferView.activeSceneResourceId[0] = audioModule.activeScene?.audioResourceId || 0;

  commitToObjectTripleBuffer(audioModule.audioStateTripleBuffer, audioModule.audioStateBufferView);

  for (let i = 0; i < audioModule.audioSources.length; i++) {
    const audioSource = audioModule.audioSources[i];

    commitToObjectTripleBuffer(audioSource.sharedWriteAudioSource, audioSource.audioSourceWriteBuffer);

    audioSource.audioSourceWriteBuffer.play[0] = 0;

    if (audioSource.audioSourceWriteBuffer.seek[0] >= 0) {
      audioSource.audioSourceWriteBuffer.seek[0] = -1;
    }
  }

  for (let i = 0; i < audioModule.mediaStreamSources.length; i++) {
    const mediaStreamSource = audioModule.mediaStreamSources[i];

    commitToObjectTripleBuffer(mediaStreamSource.sharedMediaStreamSource, mediaStreamSource.mediaStreamSourceBuffer);
  }

  for (let i = 0; i < audioModule.globalAudioEmitters.length; i++) {
    const globalAudioEmitter = audioModule.globalAudioEmitters[i];

    commitToObjectTripleBuffer(
      globalAudioEmitter.sharedGlobalAudioEmitter,
      globalAudioEmitter.globalAudioEmitterBuffer
    );
  }

  for (let i = 0; i < audioModule.positionalAudioEmitters.length; i++) {
    const positionalAudioEmitter = audioModule.positionalAudioEmitters[i];

    commitToObjectTripleBuffer(
      positionalAudioEmitter.sharedPositionalAudioEmitter,
      positionalAudioEmitter.positionalAudioEmitterBuffer
    );
  }

  updateAudioRemoteScenes(audioModule.scenes);
}
