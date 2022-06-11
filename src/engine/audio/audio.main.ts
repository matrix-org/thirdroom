import { vec3, quat, mat4 } from "gl-matrix";

import { NOOP } from "../config.common";
import { IMainThreadContext } from "../MainThread";
import { defineModule, getModule, Thread } from "../module/module.common";
import {
  AudioResourceType,
  AudioEmitterDistanceModelMap,
  AudioMessageType,
  AudioResourceProps,
  AudioSourceResourceProps,
  SharedAudioState,
  SharedPositionalAudioEmitter,
  SharedGlobalAudioEmitter,
  InitializeAudioStateMessage,
  SharedMediaStreamSource,
} from "./audio.common";
import { getLocalResource, registerResourceLoader, waitForLocalResource } from "../resource/resource.main";
import { ResourceId } from "../resource/resource.common";
import { LocalBufferView } from "../bufferView/bufferView.common";
import { PlayAudioMessage, SetAudioListenerMessage, SetAudioPeerEntityMessage } from "../WorkerMessage";
import { AudioNodeTripleBuffer } from "../node/node.common";
import { MainNode } from "../node/node.main";
import { getReadObjectBufferView } from "../allocator/ObjectBufferView";

/*********
 * Types *
 ********/

export interface MainAudioModule {
  sharedAudioState: SharedAudioState;
  context: AudioContext;
  // todo: MixerTrack/MixerInsert interface
  mainGain: GainNode;
  sampleGain: GainNode;
  // ambientGain: GainNode;
  streamMap: Map<number, MediaStream>;
  datum: LocalAudioData[];
  sources: LocalAudioSource[];
  globalEmitters: LocalGlobalAudioEmitter[];
  positionalEmitters: LocalPositionalAudioEmitter[];
  emitters: (LocalGlobalAudioEmitter | LocalPositionalAudioEmitter)[];
  nodes: MainNode[];
}

/******************
 * Initialization *
 *****************/

/*
┌────────┐
│  out   │ audio context destination
│        │
└─L────R─┘
  ▲    ▲
┌────────┐
│ main   │ main channel volume
│ gain   │ todo: connect to reverb send track
└─L────R─┘
  ▲    ▲
┌────────┐
│ sample │ sample channel volume
│ gain   │
└─L────R─┘
 */

export const AudioModule = defineModule<IMainThreadContext, MainAudioModule>({
  name: "audio",
  async create(ctx, { waitForMessage }) {
    const audioCtx = new AudioContext();

    const mainGain = new GainNode(audioCtx);
    mainGain.connect(audioCtx.destination);

    const sampleGain = new GainNode(audioCtx);
    sampleGain.connect(mainGain);

    const { sharedAudioState } = await waitForMessage<InitializeAudioStateMessage>(
      Thread.Game,
      AudioMessageType.InitializeAudioState
    );

    audioCtx.listener;

    return {
      sharedAudioState,
      context: audioCtx,
      peerMediaStreamSourceMap: new Map(),
      mainGain,
      sampleGain,
      streamMap: new Map(),
      datum: [],
      sources: [],
      globalEmitters: [],
      positionalEmitters: [],
      nodes: [],
    };
  },
  init(ctx) {
    const audio = getModule(ctx, AudioModule);

    preloadDefaultAudio(audio);

    const disposables = [
      // registerMessageHandler(ctx, AudioMessageType.PlayAudio, onPlayAudio),
      // registerMessageHandler(ctx, AudioMessageType.SetAudioListener, onSetAudioListener),
      // registerMessageHandler(ctx, AudioMessageType.SetAudioPeerEntity, onSetAudioPeerEntity),
      registerResourceLoader(ctx, AudioResourceType.AudioData, onLoadAudioData),
      registerResourceLoader(ctx, AudioResourceType.AudioSource, onLoadAudioSource),
      registerResourceLoader(ctx, AudioResourceType.MediaStreamSource, onLoadMediaStream),
      registerResourceLoader(ctx, AudioResourceType.GlobalAudioEmitter, onLoadGlobalAudioEmitter),
      registerResourceLoader(ctx, AudioResourceType.PositionalAudioEmitter, onLoadPositionalAudioEmitter),
    ];

    return () => {
      audio.context.close();

      for (const dispose of disposables) {
        dispose();
      }
    };
  },
});

/*********
 * Utils *
 ********/

/* 
Adds a new PannerNode for an entity to enable audio emissions from that particular entity.

┌────────┐
│ sample │
│ gain   │
└─L────R─┘
  ▲    ▲
┌────────┐
│ panner │
│ node   │
└─L────R─┘
 */
export const addEntityPanner = (
  audioState: MainAudioModule,
  eid: number,
  panner: PannerNode = new PannerNode(audioState.context)
) => {
  panner.panningModel = "HRTF";
  panner.connect(audioState.sampleGain);
  audioState.entityPanners.set(eid, panner);
  return panner;
};

export const preloadDefaultAudio = async (
  audioState: MainAudioModule,
  defaultAudioFiles: string[] = ["/audio/bach.mp3", "/audio/hit.wav"]
) => {
  defaultAudioFiles.forEach(async (file) => await getAudioBuffer(audioState, file));
};

const isChrome = /Chrome/.test(navigator.userAgent);

export const setPeerMediaStream = (audioState: MainAudioModule, peerId: string, mediaStream: MediaStream) => {
  // https://bugs.chromium.org/p/chromium/issues/detail?id=933677
  if (isChrome) {
    const audioEl = new Audio();
    audioEl.srcObject = mediaStream;
    audioEl.setAttribute("autoplay", "autoplay");
    audioEl.muted = true;
  }
  audioState.peerMediaStreamMap.set(peerId, mediaStream);
};

export const fetchAudioBuffer = async (ctx: AudioContext, filepath: string) => {
  const response = await fetch(filepath);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
  return audioBuffer;
};

export const getAudioBuffer = async (
  { context, sample: { cache } }: MainAudioModule,
  filepath: string
): Promise<AudioBuffer> => {
  if (cache.has(filepath)) return cache.get(filepath) as AudioBuffer;

  const audioBuffer = await fetchAudioBuffer(context, filepath);
  cache.set(filepath, audioBuffer);

  return audioBuffer;
};

const rndRange = (min: number, max: number) => Math.random() * (max - min) + min;

export const playAudioBuffer = (
  { context, sampleGain }: MainAudioModule,
  audioBuffer: AudioBuffer,
  out: AudioNode = sampleGain
) => {
  const sampleSource = context.createBufferSource();
  sampleSource.buffer = audioBuffer;
  sampleSource.playbackRate.value = rndRange(0.25, 0.75);
  sampleSource.connect(out);
  sampleSource.start();
  return sampleSource;
};

export const playAudioElement = (
  { context, sampleGain }: MainAudioModule,
  audioElement: AudioBuffer,
  out: AudioNode = sampleGain
) => {
  const sampleSource = context.createBufferSource();
  sampleSource.buffer = audioBuffer;
  sampleSource.playbackRate.value = rndRange(0.25, 0.75);
  sampleSource.connect(out);
  sampleSource.start();
  return sampleSource;
};

export const playAudioAtEntity = async (audioState: MainAudioModule, filepath: string, eid: number) => {
  const audioBuffer = await getAudioBuffer(audioState, filepath);
  if (audioBuffer) {
    let panner = audioState.entityPanners.get(eid);
    if (!panner) panner = addEntityPanner(audioState, eid);
    playAudioBuffer(audioState, audioBuffer, panner);
  } else console.error(`error: could not play audio ${filepath} - audio buffer not found`);
};

/********************
 * Message Handlers *
 *******************/

export const onPlayAudio = async (mainThread: IMainThreadContext, message: PlayAudioMessage) => {
  const audio = getModule(mainThread, AudioModule);
  const { filepath, eid } = message;

  if (eid !== NOOP) {
    playAudioAtEntity(audio, filepath, eid);
    return;
  }
  const audioBuffer = await getAudioBuffer(audio, filepath);
  if (audioBuffer) playAudioBuffer(audio, audioBuffer);
  else console.error(`error: could not play audio ${filepath} - audio buffer not found`);
};

// sets the entity that the listener is positioned at
export const onSetAudioListener = (mainThread: IMainThreadContext, message: SetAudioListenerMessage) => {
  const audio = getModule(mainThread, AudioModule);
  audio.listenerEntity = message.eid;
};

/*
Connects a MediaStream to an entity's PannerNode to enable spatial VoIP

┌────────┐
│ panner │
│ node   │
└─L────R─┘
  ▲    ▲
┌────────┐
│ media  │
│ stream │
└─L────R─┘
 */
export const onSetAudioPeerEntity = (mainThread: IMainThreadContext, message: SetAudioPeerEntityMessage) => {
  const audioModule = getModule(mainThread, AudioModule);
  const { peerId, eid } = message;

  audioModule.peerEntities.set(peerId, eid);

  const mediaStreamSource = audioModule.peerMediaStreamSourceMap.get(peerId);
  if (!mediaStreamSource)
    return console.error("could not setAudioPeerEntity - mediaStreamSource not found for peer", peerId);

  let panner = audioModule.entityPanners.get(eid);
  if (!panner) panner = addEntityPanner(audioModule, eid);

  mediaStreamSource.connect(panner);
};

/////////////////////////////
/////////////////////////////
//////////// NEW ////////////
/////////////////////////////
/////////////////////////////

interface LocalAudioData {
  resourceId: ResourceId;
  data: AudioBuffer | HTMLAudioElement;
}

const MAX_AUDIO_BYTES = 640_000;

const audioExtensionToMimeType: { [key: string]: string } = {
  mp3: "audio/mpeg",
  aac: "audio/mpeg",
  opus: "audio/ogg",
  ogg: "audio/ogg",
  wav: "audio/wav",
  flac: "audio/flac",
  mp4: "audio/mp4",
  webm: "audio/webm",
};

// TODO: Read fetch response headers
function getAudioMimeType(uri: string) {
  const extension = uri.split(".").pop() || "";
  return audioExtensionToMimeType[extension] || "audio/mpeg";
}

export const onLoadAudioData = async (
  ctx: IMainThreadContext,
  resourceId: ResourceId,
  props: AudioResourceProps
): Promise<LocalAudioData> => {
  const audio = getModule(ctx, AudioModule);

  let buffer: ArrayBuffer;
  let mimeType: string;

  // TODO: Add support for loading audio with HTMLAudioElement for longer clips
  if ("bufferView" in props) {
    const bufferView = await waitForLocalResource<LocalBufferView>(ctx, props.bufferView);
    buffer = bufferView.buffer;
    mimeType = props.mimeType;
  } else {
    const response = await fetch(props.uri);

    const contentType = response.headers.get("Content-Type");

    if (contentType) {
      mimeType = contentType;
    } else {
      mimeType = getAudioMimeType(props.uri);
    }

    buffer = await response.arrayBuffer();
  }

  let data: AudioBuffer | HTMLAudioElement;

  if (buffer.byteLength > MAX_AUDIO_BYTES) {
    const objectUrl = URL.createObjectURL(new Blob([buffer], { type: mimeType }));

    const audioEl = new Audio();

    await new Promise((resolve, reject) => {
      audioEl.oncanplaythrough = resolve;
      audioEl.onerror = reject;
      audioEl.src = objectUrl;
    });

    data = audioEl;
  } else {
    data = await audio.context.decodeAudioData(buffer);
  }

  return {
    resourceId,
    data,
  };
};

interface LocalMediaStream {
  resourceId: ResourceId;
  streamId: number;
  mediaStream: MediaStream;
}

export const onLoadMediaStream = async (
  ctx: IMainThreadContext,
  resourceId: ResourceId,
  sharedMediaStreamSource: SharedMediaStreamSource
): Promise<LocalMediaStream> => {
  const audio = getModule(ctx, AudioModule);

  const sharedMedia = getReadObjectBufferView(sharedMediaStreamSource);

  const streamId = sharedMedia.streamId[0];

  const mediaStream = audio.streamMap.get(streamId);

  if (!mediaStream) {
    throw new Error(`Media stream not found for streamId: ${streamId}`);
  }

  return {
    resourceId,
    streamId,
    mediaStream,
  };
};

interface LocalAudioSource {
  resourceId: ResourceId;
  data: LocalAudioData;
  mediaElementSourceNode?: MediaElementAudioSourceNode;
  autoPlay: boolean;
  playing: boolean;
  loop: boolean;
  currentTime: number;
  gainNode: GainNode;
}

export const onLoadAudioSource = async (
  ctx: IMainThreadContext,
  resourceId: ResourceId,
  props: AudioSourceResourceProps
): Promise<LocalAudioSource> => {
  const audio = getModule(ctx, AudioModule);

  const localAudio = await waitForLocalResource<LocalAudioData>(ctx, props.resourceId);

  const mediaElementSourceNode =
    localAudio.data instanceof HTMLAudioElement
      ? audio.context.createMediaElementSource(localAudio.data.cloneNode() as HTMLAudioElement)
      : undefined;

  const gainNode = audio.context.createGain();

  if (mediaElementSourceNode) mediaElementSourceNode.connect(gainNode);

  return {
    resourceId,
    data: localAudio,
    mediaElementSourceNode,
    autoPlay: props.autoPlay,
    loop: props.loop,
    playing: false,
    currentTime: 0,
    gainNode,
  };
};

export interface LocalPositionalAudioEmitter {
  resourceId: ResourceId;
  sources: LocalAudioSource[];
  lastSources: LocalAudioSource[];
  gainNode: GainNode;
  sharedPositionalAudioEmitter: SharedPositionalAudioEmitter;
}

export const onLoadPositionalAudioEmitter = async (
  ctx: IMainThreadContext,
  resourceId: ResourceId,
  sharedPositionalAudioEmitter: SharedPositionalAudioEmitter
): Promise<LocalPositionalAudioEmitter> => {
  const audioModule = getModule(ctx, AudioModule);

  const sharedEmitter = getReadObjectBufferView(sharedPositionalAudioEmitter);

  const sourcePromises: Promise<LocalAudioSource>[] = Array.from(sharedEmitter.sources)
    .filter((rid) => rid !== 0)
    .map((rid) => waitForLocalResource<LocalAudioSource>(ctx, rid as number));

  const sources = await Promise.all(sourcePromises);

  const gainNode = audioModule.context.createGain();
  gainNode.connect(audioModule.mainGain);

  for (const source of sources) {
    source.gainNode.connect(gainNode);
  }

  return {
    resourceId,
    sources,
    lastSources: sources,
    gainNode,
    sharedPositionalAudioEmitter,
  };
};

interface LocalGlobalAudioEmitter {
  resourceId: ResourceId;
  sources: LocalAudioSource[];
  lastSources: LocalAudioSource[];
  gainNode: GainNode;
  sharedGlobalAudioEmitter: SharedGlobalAudioEmitter;
}

export const onLoadGlobalAudioEmitter = async (
  ctx: IMainThreadContext,
  resourceId: ResourceId,
  sharedGlobalAudioEmitter: SharedGlobalAudioEmitter
): Promise<LocalGlobalAudioEmitter> => {
  const audioModule = getModule(ctx, AudioModule);

  const sharedGlobalAudioEmitterView = getReadObjectBufferView(sharedGlobalAudioEmitter);

  const sourcePromises: Promise<LocalAudioSource>[] = Array.from(sharedGlobalAudioEmitterView.sources)
    .filter((rid) => rid !== 0)
    .map((rid) => waitForLocalResource<LocalAudioSource>(ctx, rid as number));

  const sources = await Promise.all(sourcePromises);

  const gainNode = audioModule.context.createGain();
  gainNode.connect(audioModule.mainGain);

  for (const source of sources) {
    source.gainNode.connect(gainNode);
  }

  return {
    resourceId,
    sources,
    lastSources: sources,
    gainNode,
    sharedGlobalAudioEmitter,
  };
};

/***********
 * Systems *
 **********/

const tempPosition = vec3.create();
const tempQuaternion = quat.create();
const tempScale = vec3.create();

export function updateLocalPositionalAudioEmitter(audio: MainAudioModule, node: MainNode) {
  const { currentTime } = audio.context;
  const { audioEmitterPannerNode: pannerNode, audioEmitter, audioSharedNode } = node;

  const sharedAudio = getReadObjectBufferView(audioSharedNode);

  const sharedEmitter = audioEmitter ? getReadObjectBufferView(audioEmitter.sharedPositionalAudioEmitter) : undefined;

  if (!pannerNode) {
    console.error("no panner node found for local resource id", node.resourceId);
    return;
  }

  if (!sharedEmitter) {
    console.error("no audio emitter found for local resource id", node.resourceId);
    return;
  }

  // set position using worldMatrix from AudioSharedNode
  mat4.getTranslation(tempPosition, sharedAudio.worldMatrix);
  pannerNode.positionX.setValueAtTime(tempPosition[0], currentTime);
  pannerNode.positionY.setValueAtTime(tempPosition[1], currentTime);
  pannerNode.positionZ.setValueAtTime(tempPosition[2], currentTime);

  // set panner node properties from local positional emitter's shared data
  pannerNode.coneInnerAngle = sharedEmitter.coneInnerAngle[0];
  pannerNode.coneOuterAngle = sharedEmitter.coneOuterAngle[0];
  pannerNode.coneOuterGain = sharedEmitter.coneOuterGain[0];
  pannerNode.distanceModel = AudioEmitterDistanceModelMap[sharedEmitter.distanceModel[0]];
  pannerNode.maxDistance = sharedEmitter.maxDistance[0];
  pannerNode.refDistance = sharedEmitter.refDistance[0];
  pannerNode.rolloffFactor = sharedEmitter.rolloffFactor[0];
}

function setAudioListenerTransform(listener: AudioListener, worldMatrix: Float32Array) {
  mat4.getTranslation(tempPosition, worldMatrix);
  mat4.getRotation(tempQuaternion, worldMatrix);
  mat4.getScaling(tempScale, worldMatrix);

  if (isNaN(tempQuaternion[0])) {
    return;
  }

  if (listener.upX) {
    listener.upX.value = 0;
    listener.upY.value = 1;
    listener.upZ.value = 0;
  }

  if (listener.positionX) {
    listener.positionX.value = tempPosition[0];
    listener.positionY.value = tempPosition[1];
    listener.positionZ.value = tempPosition[2];
  } else {
    listener.setPosition(tempPosition[0], tempPosition[1], tempPosition[2]);
  }

  tempPosition[0] = -worldMatrix[8];
  tempPosition[1] = -worldMatrix[9];
  tempPosition[2] = -worldMatrix[10];

  vec3.normalize(tempPosition, tempPosition);

  if (listener.forwardX) {
    listener.forwardX.value = tempPosition[0];
    listener.forwardY.value = tempPosition[1];
    listener.forwardZ.value = tempPosition[2];
  } else {
    listener.setOrientation(tempPosition[0], tempPosition[1], tempPosition[2], 0, 1, 0);
  }
}

export function updateLocalPositionalAudioEmitters(
  audioModule: MainAudioModule,
  audioEmitter: LocalGlobalAudioEmitter | LocalPositionalAudioEmitter
) {
  for (let i = 0; i < audioModule.nodes.length; i++) {
    const node = audioModule.nodes[i];
    updateLocalPositionalAudioEmitter(audioModule, node);
  }
}

export function updateAudioEmitter(
  audioModule: MainAudioModule,
  audioEmitter: LocalGlobalAudioEmitter | LocalPositionalAudioEmitter
) {
  // todo: synchronize and load audioEmitter.sources with shared state sources

  for (const source of audioEmitter.sources) {
    // todo:
    // if this source wasn't here last frame and now is
    const isNewSource = false;
    // if this source was here last frame and now isn't
    const isDeadSource = false;

    const { data } = source.data;
    if (data instanceof AudioBuffer) {
      if (source.playing) playAudioBuffer(audioModule, data as AudioBuffer, audioEmitter.gainNode);
      source.playing = false;
      // todo: persist playing state back to game thread
    } else if (data instanceof HTMLAudioElement) {
      if (isNewSource) source.mediaElementSourceNode?.connect(audioEmitter.gainNode);
      if (isDeadSource) source.mediaElementSourceNode?.disconnect(audioEmitter.gainNode);
      if (source.playing) data.play();
      else data.pause();
    }
  }

  audioEmitter.lastSources = audioEmitter.sources;
}

export function updateAudioEmitters(
  audioModule: MainAudioModule,
  audioEmitters: (LocalGlobalAudioEmitter | LocalPositionalAudioEmitter)[]
) {
  for (let i = 0; i < audioEmitters.length; i++) {
    const audioEmitter = audioEmitters[i];
    updateAudioEmitter(audioModule, audioEmitter);
  }
}

function updateAudioListener(ctx: IMainThreadContext, audioModule: MainAudioModule) {
  const sharedAudio = getReadObjectBufferView(audioModule.sharedAudioState);

  if (sharedAudio.activeAudioListenerResourceId[0] !== NOOP) {
    const audioListenerNode = getLocalResource<AudioNodeTripleBuffer>(
      ctx,
      sharedAudio.activeAudioListenerResourceId[0]
    )?.resource;

    if (audioListenerNode) {
      setAudioListenerTransform(audioModule.context.listener, audioListenerNode.worldMatrix);
    }
  }
}

export function MainThreadAudioSystem(ctx: IMainThreadContext) {
  const audioModule = getModule(ctx, AudioModule);

  updateAudioListener(ctx, audioModule);
  updateAudioEmitters(audioModule, audioModule.emitters);
}
