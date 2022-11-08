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
import { addResourceRef, createResource, disposeResource } from "../resource/resource.game";
import { RemoteScene, RemoteSceneComponent, updateAudioRemoteScenes } from "../scene/scene.game";
import { RemoteNodeComponent } from "../node/node.game";
import { RemoteNametag, updateRemoteNametags } from "../nametag/nametag.game";
import { RemoteBufferView } from "../resource/schema";

interface GameAudioModuleState {
  audioStateBufferView: ObjectBufferView<typeof audioStateSchema, ArrayBuffer>;
  audioStateTripleBuffer: AudioStateTripleBuffer;
  audioSources: RemoteAudioSource[];
  mediaStreamSources: RemoteMediaStreamSource[];
  globalAudioEmitters: RemoteGlobalAudioEmitter[];
  positionalAudioEmitters: RemotePositionalAudioEmitter[];
  scenes: RemoteScene[];
  nametags: RemoteNametag[];
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
      audioSources: [],
      mediaStreamSources: [],
      globalAudioEmitters: [],
      positionalAudioEmitters: [],
      scenes: [],
      nametags: [],
    };
  },
  init() {},
});

/**
 * API
 */

export interface RemoteAudioData {
  name: string;
  resourceId: number;
  uri?: string;
  bufferView?: RemoteBufferView;
}

export interface BufferViewAudioDataProps {
  name?: string;
  bufferView: RemoteBufferView;
  mimeType: string;
}

export interface AudioDataProps {
  name?: string;
  uri: string;
}

const DEFAULT_AUDIO_DATA_NAME = "Audio Data";

export function createRemoteAudioFromBufferView(ctx: GameState, props: BufferViewAudioDataProps): RemoteAudioData {
  const name = props.name || DEFAULT_AUDIO_DATA_NAME;

  addResourceRef(ctx, props.bufferView.resourceId);

  return {
    name,
    resourceId: createResource<AudioResourceProps>(
      ctx,
      Thread.Main,
      AudioResourceType.AudioData,
      {
        bufferView: props.bufferView.resourceId,
        mimeType: props.mimeType,
      },
      {
        name,
        dispose() {
          disposeResource(ctx, props.bufferView.resourceId);
        },
      }
    ),
    bufferView: props.bufferView,
  };
}

export function createRemoteAudioData(ctx: GameState, props: AudioDataProps): RemoteAudioData {
  const name = props.name || DEFAULT_AUDIO_DATA_NAME;

  return {
    name,
    resourceId: createResource<AudioResourceProps>(
      ctx,
      Thread.Main,
      AudioResourceType.AudioData,
      {
        uri: props.uri,
      },
      {
        name,
      }
    ),
  };
}

export interface RemoteAudioSource {
  name: string;
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
  name?: string;
  audio?: RemoteAudioData;
  gain?: number;
  playbackRate?: number;
  startTime?: number;
  autoPlay?: boolean;
  loop?: boolean;
}

const DEFAULT_AUDIO_SOURCE_NAME = "Audio Source";

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

  const name = props?.name || DEFAULT_AUDIO_SOURCE_NAME;

  let _audio: RemoteAudioData | undefined = props?.audio;

  if (_audio) {
    addResourceRef(ctx, _audio.resourceId);
  }

  const resourceId = createResource<SharedAudioSourceResource>(
    ctx,
    Thread.Main,
    AudioResourceType.AudioSource,
    {
      writeAudioSourceTripleBuffer: sharedWriteAudioSource,
      readAudioSourceTripleBuffer: sharedReadAudioSource,
    },
    {
      name,
      dispose() {
        if (_audio) {
          disposeResource(ctx, _audio.resourceId);
        }

        const index = audioModule.audioSources.findIndex((source) => source.resourceId === resourceId);

        if (index !== -1) {
          audioModule.audioSources.splice(index, 1);
        }
      },
    }
  );

  const remoteAudioSource: RemoteAudioSource = {
    name,
    resourceId,
    audioSourceWriteBuffer,
    audioSourceReadBuffer,
    sharedWriteAudioSource,
    sharedReadAudioSource,
    get audio(): RemoteAudioData | undefined {
      return _audio;
    },
    set audio(audio: RemoteAudioData | undefined) {
      if (audio) {
        addResourceRef(ctx, audio.resourceId);
      }

      if (_audio) {
        disposeResource(ctx, _audio.resourceId);
      }

      _audio = audio;
      audioSourceWriteBuffer.audio[0] = audio ? audio.resourceId : 0;
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
  name: string;
  resourceId: ResourceId;
}

interface MediaStreamProps {
  name?: string;
  streamId: string;
}

const DEFAULT_MEDIA_STREAM_NAME = "Media Stream";

export function createRemoteMediaStream(ctx: GameState, props: MediaStreamProps): RemoteMediaStream {
  const name = props.name || DEFAULT_MEDIA_STREAM_NAME;

  return {
    name,
    resourceId: createResource<SharedMediaStreamResource>(
      ctx,
      Thread.Main,
      AudioResourceType.MediaStreamId,
      {
        streamId: props.streamId,
      },
      {
        name,
      }
    ),
  };
}

export interface RemoteMediaStreamSource {
  name: string;
  resourceId: number;
  mediaStreamSourceBuffer: ObjectBufferView<typeof mediaStreamSourceSchema, ArrayBuffer>;
  mediaStreamSourceTripleBuffer: MediaStreamSourceTripleBuffer;
  get stream(): RemoteMediaStream | undefined;
  set stream(value: RemoteMediaStream | undefined);
  get gain(): number;
  set gain(value: number);
}

export interface MediaStreamSourceProps {
  name?: string;
  stream?: RemoteMediaStream;
  gain?: number;
}

const DEFAULT_MEDIA_STREAM_SOURCE = "Media Stream Source";

export function createRemoteMediaStreamSource(ctx: GameState, props?: MediaStreamSourceProps): RemoteMediaStreamSource {
  const audioModule = getModule(ctx, GameAudioModule);

  const mediaStreamSourceBuffer = createObjectBufferView(mediaStreamSourceSchema, ArrayBuffer);

  mediaStreamSourceBuffer.stream[0] = props?.stream?.resourceId || 0;
  mediaStreamSourceBuffer.gain[0] = props?.gain === undefined ? 1 : props.gain;

  const mediaStreamSourceTripleBuffer = createObjectTripleBuffer(
    mediaStreamSourceSchema,
    ctx.gameToMainTripleBufferFlags
  );

  const name = props?.name || DEFAULT_MEDIA_STREAM_SOURCE;

  let _stream: RemoteMediaStream | undefined = props?.stream || undefined;

  if (_stream) {
    addResourceRef(ctx, _stream.resourceId);
  }

  const resourceId = createResource<MediaStreamSourceTripleBuffer>(
    ctx,
    Thread.Main,
    AudioResourceType.MediaStreamSource,
    mediaStreamSourceTripleBuffer,
    {
      name,
      dispose() {
        if (_stream) {
          disposeResource(ctx, _stream.resourceId);
        }

        const index = audioModule.mediaStreamSources.findIndex((source) => source.resourceId === resourceId);

        if (index !== -1) {
          audioModule.mediaStreamSources.splice(index, 1);
        }
      },
    }
  );

  const remoteMediaStreamSource: RemoteMediaStreamSource = {
    name,
    resourceId,
    mediaStreamSourceBuffer,
    mediaStreamSourceTripleBuffer,
    get stream(): RemoteMediaStream | undefined {
      return _stream;
    },
    set stream(stream: RemoteMediaStream | undefined) {
      if (stream) {
        addResourceRef(ctx, stream.resourceId);
      }

      if (_stream) {
        disposeResource(ctx, _stream.resourceId);
      }

      _stream = stream;
      mediaStreamSourceBuffer.stream[0] = stream?.resourceId || 0;
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

const DEFAULT_GLOBAL_AUDIO_EMITTER_NAME = "Global Audio Emitter";

export interface RemoteGlobalAudioEmitter {
  name: string;
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
  name?: string;
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

  const name = props?.name || DEFAULT_GLOBAL_AUDIO_EMITTER_NAME;

  let _sources: RemoteEmitterSource[] = props?.sources || [];

  for (const source of _sources) {
    addResourceRef(ctx, source.resourceId);
  }

  const resourceId = createResource<SharedAudioEmitterResource>(
    ctx,
    Thread.Main,
    AudioResourceType.AudioEmitter,
    {
      type: AudioEmitterType.Global,
      emitterTripleBuffer: sharedGlobalAudioEmitter,
    },
    {
      name,
      dispose() {
        for (const source of _sources) {
          disposeResource(ctx, source.resourceId);
        }

        const index = audioModule.globalAudioEmitters.findIndex(
          (audioEmitter) => audioEmitter.resourceId === resourceId
        );

        if (index !== -1) {
          audioModule.globalAudioEmitters.splice(index, 1);
        }
      },
    }
  );

  const remoteGlobalAudioEmitter: RemoteGlobalAudioEmitter = {
    name,
    type: AudioEmitterType.Global,
    resourceId,
    globalAudioEmitterBuffer,
    sharedGlobalAudioEmitter,
    get sources(): RemoteEmitterSource[] {
      // TODO: Use a proxy to check for array mutation?
      return _sources;
    },
    set sources(sources: RemoteEmitterSource[]) {
      for (const source of sources) {
        addResourceRef(ctx, source.resourceId);
      }

      for (const source of _sources) {
        disposeResource(ctx, source.resourceId);
      }

      _sources = sources;
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
  name: string;
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
  get coneOuterGain(): number;
  set coneOuterGain(value: number);
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
  name?: string;
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

const DEFAULT_POSITIONAL_AUDIO_EMITTER = "Positional Audio Emitter";

export function createRemotePositionalAudioEmitter(
  ctx: GameState,
  props: PositionalAudioEmitterProps
): RemotePositionalAudioEmitter {
  const audioModule = getModule(ctx, GameAudioModule);

  const positionalAudioEmitterBuffer = createObjectBufferView(positionalAudioEmitterSchema, ArrayBuffer);

  positionalAudioEmitterBuffer.sources.set(props?.sources ? props.sources.map((source) => source.resourceId) : []);
  positionalAudioEmitterBuffer.gain[0] = props?.gain === undefined ? 1 : props.gain;
  positionalAudioEmitterBuffer.coneInnerAngle[0] = props?.coneInnerAngle === undefined ? 360 : props.coneInnerAngle;
  positionalAudioEmitterBuffer.coneOuterAngle[0] = props?.coneOuterAngle === undefined ? 0 : props.coneOuterAngle;
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

  let _sources: RemoteEmitterSource[] = props?.sources || [];

  for (const source of _sources) {
    addResourceRef(ctx, source.resourceId);
  }

  const name = props.name || DEFAULT_POSITIONAL_AUDIO_EMITTER;

  const resourceId = createResource<SharedAudioEmitterResource>(
    ctx,
    Thread.Main,
    AudioResourceType.AudioEmitter,
    {
      type: AudioEmitterType.Positional,
      emitterTripleBuffer: sharedPositionalAudioEmitter,
    },
    {
      name,
      dispose() {
        for (const source of _sources) {
          disposeResource(ctx, source.resourceId);
        }

        const index = audioModule.positionalAudioEmitters.findIndex(
          (audioEmitter) => audioEmitter.resourceId === resourceId
        );

        if (index !== -1) {
          audioModule.positionalAudioEmitters.splice(index, 1);
        }
      },
    }
  );

  const remotePositionalAudioEmitter: RemotePositionalAudioEmitter = {
    type: AudioEmitterType.Positional,
    name,
    resourceId,
    positionalAudioEmitterBuffer,
    sharedPositionalAudioEmitter,
    get sources(): RemoteEmitterSource[] {
      // TODO: Use a proxy to check for array mutation?
      return _sources;
    },
    set sources(sources: RemoteEmitterSource[]) {
      for (const source of sources) {
        addResourceRef(ctx, source.resourceId);
      }

      for (const source of _sources) {
        disposeResource(ctx, source.resourceId);
      }

      _sources = sources;
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
    get coneOuterGain(): number {
      return positionalAudioEmitterBuffer.coneOuterGain[0];
    },
    set coneOuterGain(value: number) {
      positionalAudioEmitterBuffer.coneOuterGain[0] = value;
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

export function playAudio(audioSource: RemoteAudioSource, options?: PlayAudioOptions) {
  audioSource.audioSourceWriteBuffer.play[0] = 1;
  audioSource.playing = true;
  audioSource.loop = false;
  audioSource.currentTime = 0;
  audioSource.playbackRate = 1;
  Object.assign(audioSource, options);
}

/**
 * Systems
 */

export function GameAudioSystem(ctx: GameState) {
  const audioModule = getModule(ctx, GameAudioModule);

  const activeScene = RemoteSceneComponent.get(ctx.activeScene);
  const activeCamera = RemoteNodeComponent.get(ctx.activeCamera);

  audioModule.audioStateBufferView.activeAudioListenerResourceId[0] = activeCamera?.audioResourceId || 0;
  audioModule.audioStateBufferView.activeSceneResourceId[0] = activeScene?.audioResourceId || 0;

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

    commitToObjectTripleBuffer(
      mediaStreamSource.mediaStreamSourceTripleBuffer,
      mediaStreamSource.mediaStreamSourceBuffer
    );
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
  updateRemoteNametags(audioModule.nametags);
}
