import { NOOP } from "../config.common";
import { GameState } from "../GameTypes";
import { defineModule, getModule, Thread } from "../module/module.common";
import {
  AudioEmitterDistanceModel,
  AudioMessageType,
  AudioResourceProps,
  AudioSourceResourceProps,
  AudioSourceResourceType,
  audioSourceSchema,
  audioStateSchema,
  GlobalAudioEmitterResourceProps,
  GlobalAudioEmitterResourceType,
  globalAudioEmitterSchema,
  InitializeAudioStateMessage,
  MediaStreamSourceProps,
  MediaStreamSourceResourceType,
  mediaStreamSourceSchema,
  PositionalAudioEmitterResourceProps,
  PositionalAudioEmitterResourceType,
  positionalAudioEmitterSchema,
  SharedAudioSoruceResource,
  SharedAudioSource,
  SharedAudioState,
  SharedGlobalAudioEmitter,
  SharedGlobalAudioEmitterResource,
  SharedMediaStreamSource,
  SharedMediaStreamSourceResource,
  SharedPositionalAudioEmitter,
  SharedPositionalAudioEmitterResource,
} from "./audio.common";
import {
  commitToTripleBufferView,
  createObjectBufferView,
  createTripleBufferBackedObjectBufferView,
} from "../allocator/ObjectBufferView";
import { ResourceId } from "../resource/resource.common";
import { createResource } from "../resource/resource.game";
import { RemoteBufferView } from "../bufferView/bufferView.game";
import { RemoteNodeComponent } from "../node/node.game";

interface GameAudioModuleState {
  activeAudioListenerEntity: number;
  sharedAudioState: SharedAudioState;
  audioSources: RemoteAudioSource[];
  mediaStreamSources: RemoteMediaStreamSource[];
  globalAudioEmitters: RemoteGlobalAudioEmitter[];
  positionalAudioEmitters: RemotePositionalAudioEmitter[];
}

export const GameAudioModule = defineModule<GameState, GameAudioModuleState>({
  name: "audio",
  async create({ gameToRenderTripleBufferFlags }, { sendMessage }) {
    const audioState = createObjectBufferView(audioStateSchema, ArrayBuffer);

    const sharedAudioState = createTripleBufferBackedObjectBufferView(
      audioStateSchema,
      audioState,
      gameToRenderTripleBufferFlags
    );

    sendMessage<InitializeAudioStateMessage>(Thread.Render, AudioMessageType.InitializeAudioState, {
      sharedAudioState,
    });

    return {
      activeAudioListenerEntity: NOOP,
      sharedAudioState,
      audioSources: [],
      mediaStreamSources: [],
      globalAudioEmitters: [],
      positionalAudioEmitters: [],
    };
  },
  init() {},
});

/**
 * API
 */

export interface RemoteAudio {
  resourceId: number;
  uri?: string;
  bufferView?: RemoteBufferView<Thread.Main>;
}

export function createRemoteAudioFromBufferView(
  ctx: GameState,
  bufferView: RemoteBufferView<Thread.Main>,
  mimeType: string
): RemoteAudio {
  return {
    resourceId: createResource<AudioResourceProps>(ctx, Thread.Main, AudioSourceResourceType, {
      bufferView: bufferView.resourceId,
      mimeType,
    }),
    bufferView,
  };
}

export function createRemoteAudio(ctx: GameState, uri: string): RemoteAudio {
  return {
    resourceId: createResource<AudioResourceProps>(ctx, Thread.Main, AudioSourceResourceType, {
      uri,
    }),
  };
}

interface RemoteAudioSource {
  resourceId: number;
  sharedAudioSource: SharedAudioSource;
  get audio(): RemoteAudio | undefined;
  set audio(value: RemoteAudio | undefined);
  get gain(): number;
  set gain(value: number);
  get currentTime(): number;
  set currentTime(value: number);
  get playing(): boolean;
  set playing(value: boolean);
  get loop(): boolean;
  set loop(value: boolean);
}

interface AudioSourceProps {
  audio?: RemoteAudio;
  gain?: number;
  currentTime?: number;
  autoPlay?: boolean;
  loop?: boolean;
}

export function createRemoteAudioSource(ctx: GameState, props?: AudioSourceProps): RemoteAudioSource {
  const audioModule = getModule(ctx, GameAudioModule);

  const audioSource = createObjectBufferView(audioSourceSchema, ArrayBuffer);

  const initialProps: AudioSourceResourceProps = {
    audio: props?.audio ? props.audio.resourceId : 0,
    gain: props?.gain === undefined ? 1 : props.gain,
    autoPlay: props?.autoPlay === undefined ? true : props.autoPlay,
    loop: props?.loop === undefined ? true : props.loop,
    currentTime: props?.currentTime === undefined ? 0 : props.currentTime,
  };

  audioSource.audio[0] = initialProps.audio;
  audioSource.gain[0] = initialProps.gain;
  audioSource.playing[0] = initialProps.autoPlay ? 1 : 0;
  audioSource.loop[0] = initialProps.loop ? 1 : 0;
  audioSource.currentTime[0] = initialProps.currentTime;

  const sharedAudioSource = createTripleBufferBackedObjectBufferView(
    audioSourceSchema,
    audioSource,
    ctx.gameToMainTripleBufferFlags
  );

  const resourceId = createResource<SharedAudioSoruceResource>(ctx, Thread.Main, AudioSourceResourceType, {
    initialProps,
    sharedAudioSource,
  });

  let _audio: RemoteAudio | undefined = props?.audio;

  const remoteAudioSource: RemoteAudioSource = {
    resourceId,
    sharedAudioSource,
    get audio(): RemoteAudio | undefined {
      return _audio;
    },
    set audio(value: RemoteAudio | undefined) {
      _audio = value;
      audioSource.audio[0] = value ? value.resourceId : 0;
    },
    get gain(): number {
      return audioSource.gain[0];
    },
    set gain(value: number) {
      audioSource.gain[0] = value;
    },
    get currentTime(): number {
      return audioSource.currentTime[0];
    },
    set currentTime(value: number) {
      audioSource.currentTime[0] = value;
    },
    get playing(): boolean {
      return !!audioSource.playing[0];
    },
    set playing(value: boolean) {
      audioSource.playing[0] = value ? 1 : 0;
    },
    get loop(): boolean {
      return !!audioSource.loop[0];
    },
    set loop(value: boolean) {
      audioSource.loop[0] = value ? 1 : 0;
    },
  };

  audioModule.audioSources.push(remoteAudioSource);

  return remoteAudioSource;
}

interface RemoteMediaStreamSource {
  resourceId: number;
  sharedMediaStreamSource: SharedMediaStreamSource;
  get streamId(): number | undefined;
  set streamId(value: number | undefined);
  get gain(): number;
  set gain(value: number);
}

interface MediaStreamProps {
  streamId?: number;
  gain?: number;
}

export function createRemoteMediaStreamSource(ctx: GameState, props?: MediaStreamProps): RemoteMediaStreamSource {
  const audioModule = getModule(ctx, GameAudioModule);

  const mediaStreamSource = createObjectBufferView(mediaStreamSourceSchema, ArrayBuffer);

  const initialProps: MediaStreamSourceProps = {
    streamId: props?.streamId || 0,
    gain: props?.gain === undefined ? 1 : props.gain,
  };

  mediaStreamSource.streamId[0] = initialProps.streamId;
  mediaStreamSource.gain[0] = initialProps.gain;

  const sharedMediaStreamSource = createTripleBufferBackedObjectBufferView(
    mediaStreamSourceSchema,
    mediaStreamSource,
    ctx.gameToMainTripleBufferFlags
  );

  const resourceId = createResource<SharedMediaStreamSourceResource>(ctx, Thread.Main, MediaStreamSourceResourceType, {
    initialProps,
    sharedMediaStreamSource,
  });

  const remoteMediaStreamSource: RemoteMediaStreamSource = {
    resourceId,
    sharedMediaStreamSource,
    get streamId(): number | undefined {
      return mediaStreamSource.streamId[0] || undefined;
    },
    set streamId(value: number | undefined) {
      mediaStreamSource.streamId[0] = value || 0;
    },
    get gain(): number {
      return mediaStreamSource.gain[0];
    },
    set gain(value: number) {
      mediaStreamSource.gain[0] = value;
    },
  };

  audioModule.mediaStreamSources.push(remoteMediaStreamSource);

  return remoteMediaStreamSource;
}

type RemoteEmitterSource = RemoteAudioSource | RemoteMediaStreamSource;

interface RemoteGlobalAudioEmitter {
  resourceId: ResourceId;
  sharedGlobalAudioEmitter: SharedGlobalAudioEmitter;
  get sources(): RemoteEmitterSource[];
  set sources(sources: RemoteEmitterSource[]);
  get gain(): number;
  set gain(value: number);
}

interface GlobalAudioEmitterProps {
  sources?: RemoteEmitterSource[];
  gain?: number;
}

export function createGlobalAudioEmitter(ctx: GameState, props?: GlobalAudioEmitterProps): RemoteGlobalAudioEmitter {
  const audioModule = getModule(ctx, GameAudioModule);

  const globalAudioEmitter = createObjectBufferView(globalAudioEmitterSchema, ArrayBuffer);

  const initialProps: GlobalAudioEmitterResourceProps = {
    sources: props?.sources ? props.sources.map((source) => source.resourceId) : [],
    gain: props?.gain === undefined ? 1 : props.gain,
  };

  globalAudioEmitter.sources.set(initialProps.sources);
  globalAudioEmitter.gain[0] = initialProps.gain;

  const sharedGlobalAudioEmitter = createTripleBufferBackedObjectBufferView(
    globalAudioEmitterSchema,
    globalAudioEmitter,
    ctx.gameToMainTripleBufferFlags
  );

  const resourceId = createResource<SharedGlobalAudioEmitterResource>(
    ctx,
    Thread.Main,
    GlobalAudioEmitterResourceType,
    {
      initialProps,
      sharedGlobalAudioEmitter,
    }
  );

  let _sources: RemoteEmitterSource[] = props?.sources || [];

  const remoteGlobalAudioEmitter: RemoteGlobalAudioEmitter = {
    resourceId,
    sharedGlobalAudioEmitter,
    get sources(): RemoteEmitterSource[] {
      // TODO: Use a proxy to check for array mutation?
      return _sources;
    },
    set sources(value: RemoteEmitterSource[]) {
      _sources = value;
      globalAudioEmitter.sources.set(_sources.map((source) => source.resourceId));
    },
    get gain(): number {
      return globalAudioEmitter.gain[0];
    },
    set gain(value: number) {
      globalAudioEmitter.gain[0] = value;
    },
  };

  audioModule.globalAudioEmitters.push(remoteGlobalAudioEmitter);

  return remoteGlobalAudioEmitter;
}

interface RemotePositionalAudioEmitter {
  resourceId: ResourceId;
  sharedPositionalAudioEmitter: SharedPositionalAudioEmitter;
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
}

interface PositionalAudioEmitterProps {
  sources?: RemoteEmitterSource[];
  gain?: number;
  coneInnerAngle?: number;
  coneOuterAngle?: number;
  coneOuterGain?: number;
  distanceModel?: AudioEmitterDistanceModel;
  maxDistance?: number;
  refDistance?: number;
  rolloffFactor?: number;
}

export function createRemotePositionalAudioEmitter(
  ctx: GameState,
  props: PositionalAudioEmitterProps
): RemotePositionalAudioEmitter {
  const audioModule = getModule(ctx, GameAudioModule);

  const positionalAudioEmitter = createObjectBufferView(positionalAudioEmitterSchema, ArrayBuffer);

  const initialProps: PositionalAudioEmitterResourceProps = {
    sources: props?.sources ? props.sources.map((source) => source.resourceId) : [],
    gain: props?.gain === undefined ? 1 : props.gain,
    coneInnerAngle: props?.coneInnerAngle === undefined ? Math.PI * 2 : props.coneInnerAngle,
    coneOuterAngle: props?.coneOuterAngle === undefined ? Math.PI * 2 : props.coneOuterAngle,
    coneOuterGain: props?.coneOuterGain === undefined ? 0 : props.coneOuterGain,
    distanceModel: props?.distanceModel === undefined ? AudioEmitterDistanceModel.Inverse : props.distanceModel,
    maxDistance: props?.maxDistance === undefined ? 10000 : props.maxDistance,
    refDistance: props?.refDistance === undefined ? 1 : props.refDistance,
    rolloffFactor: props?.rolloffFactor === undefined ? 1 : props.rolloffFactor,
  };

  positionalAudioEmitter.sources.set(initialProps.sources);
  positionalAudioEmitter.gain[0] = initialProps.gain;
  positionalAudioEmitter.coneInnerAngle[0] = initialProps.coneInnerAngle;
  positionalAudioEmitter.coneOuterAngle[0] = initialProps.coneOuterAngle;
  positionalAudioEmitter.coneOuterGain[0] = initialProps.coneOuterGain;
  positionalAudioEmitter.distanceModel[0] = initialProps.distanceModel;
  positionalAudioEmitter.maxDistance[0] = initialProps.maxDistance;
  positionalAudioEmitter.refDistance[0] = initialProps.refDistance;
  positionalAudioEmitter.rolloffFactor[0] = initialProps.rolloffFactor;

  // TODO: Initialize world matrix when adding component

  const sharedPositionalAudioEmitter = createTripleBufferBackedObjectBufferView(
    positionalAudioEmitterSchema,
    positionalAudioEmitter,
    ctx.gameToMainTripleBufferFlags
  );

  const resourceId = createResource<SharedPositionalAudioEmitterResource>(
    ctx,
    Thread.Main,
    PositionalAudioEmitterResourceType,
    {
      initialProps,
      sharedPositionalAudioEmitter,
    }
  );

  let _sources: RemoteEmitterSource[] = props?.sources || [];

  const remotePositionalAudioEmitter: RemotePositionalAudioEmitter = {
    resourceId,
    sharedPositionalAudioEmitter,
    get sources(): RemoteEmitterSource[] {
      // TODO: Use a proxy to check for array mutation?
      return _sources;
    },
    set sources(value: RemoteEmitterSource[]) {
      _sources = value;
      positionalAudioEmitter.sources.set(_sources.map((source) => source.resourceId));
    },
    get gain(): number {
      return positionalAudioEmitter.gain[0];
    },
    set gain(value: number) {
      positionalAudioEmitter.gain[0] = value;
    },
    get coneInnerAngle(): number {
      return positionalAudioEmitter.coneInnerAngle[0];
    },
    set coneInnerAngle(value: number) {
      positionalAudioEmitter.coneInnerAngle[0] = value;
    },
    get coneOuterAngle(): number {
      return positionalAudioEmitter.coneOuterAngle[0];
    },
    set coneOuterAngle(value: number) {
      positionalAudioEmitter.coneOuterAngle[0] = value;
    },
    get distanceModel(): AudioEmitterDistanceModel {
      return positionalAudioEmitter.distanceModel[0];
    },
    set distanceModel(value: AudioEmitterDistanceModel) {
      positionalAudioEmitter.distanceModel[0] = value;
    },
    get maxDistance(): number {
      return positionalAudioEmitter.maxDistance[0];
    },
    set maxDistance(value: number) {
      positionalAudioEmitter.maxDistance[0] = value;
    },
    get refDistance(): number {
      return positionalAudioEmitter.refDistance[0];
    },
    set refDistance(value: number) {
      positionalAudioEmitter.refDistance[0] = value;
    },
    get rolloffFactor(): number {
      return positionalAudioEmitter.rolloffFactor[0];
    },
    set rolloffFactor(value: number) {
      positionalAudioEmitter.rolloffFactor[0] = value;
    },
  };

  audioModule.positionalAudioEmitters.push(remotePositionalAudioEmitter);

  return remotePositionalAudioEmitter;
}

interface PlayAudioOptions {
  gain?: number;
  startTime?: number;
  loop?: boolean;
}

export function playAudio(audioSource: RemoteAudioSource, audio?: RemoteAudio, options?: PlayAudioOptions) {
  if (audio !== undefined) {
    audioSource.audio = audio;
  }

  audioSource.playing = true;
  audioSource.loop = false;
  audioSource.currentTime = 0;

  if (options) {
    if (options.gain !== undefined) {
      audioSource.gain = options.gain;
    }

    if (options.startTime !== undefined) {
      audioSource.currentTime = options.startTime;
    }

    if (options.loop !== undefined) {
      audioSource.loop = options.loop;
    }
  }
}

export function setActiveAudioListener(ctx: GameState, eid: number) {
  const audioModule = getModule(ctx, GameAudioModule);
  audioModule.activeAudioListenerEntity = eid;
}

/**
 * Systems
 */

export function AudioSystem(ctx: GameState) {
  const audioModule = getModule(ctx, GameAudioModule);

  const listenerEid = audioModule.activeAudioListenerEntity;

  const remoteNode = RemoteNodeComponent.get(listenerEid);

  if (remoteNode) {
    audioModule.sharedAudioState.activeListenerResourceId[0] = remoteNode.resourceId;
  } else {
    audioModule.sharedAudioState.activeListenerResourceId[0] = 0;
  }

  commitToTripleBufferView(audioModule.sharedAudioState);

  for (let i = 0; i < audioModule.audioSources.length; i++) {
    const audioSource = audioModule.audioSources[i];

    commitToTripleBufferView(audioSource.sharedAudioSource);
  }

  for (let i = 0; i < audioModule.mediaStreamSources.length; i++) {
    const mediaStreamSource = audioModule.mediaStreamSources[i];

    commitToTripleBufferView(mediaStreamSource.sharedMediaStreamSource);
  }

  for (let i = 0; i < audioModule.globalAudioEmitters.length; i++) {
    const globalAudioEmitter = audioModule.globalAudioEmitters[i];

    commitToTripleBufferView(globalAudioEmitter.sharedGlobalAudioEmitter);
  }

  for (let i = 0; i < audioModule.positionalAudioEmitters.length; i++) {
    const positionalAudioEmitter = audioModule.positionalAudioEmitters[i];

    commitToTripleBufferView(positionalAudioEmitter.sharedPositionalAudioEmitter);
  }
}
