import { Matrix4, Quaternion, Vector3 } from "three";

import { NOOP } from "../config.common";
import { IMainThreadContext } from "../MainThread";
import { defineModule, getModule, registerMessageHandler, Thread } from "../module/module.common";
import {
  AudioEmitterDistanceModelMap,
  AudioMessageType,
  AudioResourceProps,
  AudioSourceResourceProps,
  AudioSourceResourceType,
  PositionalAudioEmitterResourceProps,
  SharedAudioState,
  SharedPositionalAudioEmitter,
} from "./audio.common";
import { getReadObjectBufferView } from "../allocator/ObjectBufferView";
import { registerResourceLoader, waitForLocalResource } from "../resource/resource.main";
import { ResourceId } from "../resource/resource.common";
import { RemoteBufferView } from "../bufferView/bufferView.game";
import { LocalBufferView } from "../bufferView/bufferView.common";
import { NetworkModule } from "../network/network.main";
import { mat4, quat, vec3 } from "gl-matrix";

/*********
 * Types *
 ********/

export interface AudioModuleState {
  sharedAudioState: SharedAudioState;
  context: AudioContext;
  mainGain: GainNode;
  streamMap: Map<number, MediaStream>;
  audio: LocalAudio[];
  sources: LocalAudioSource[];
  globalEmitters: LocalGlobalAudioEmitter[];
  positionalEmitters: LocalPositionalAudioEmitter[];
}

/******************
 * Initialization *
 *****************/

// todo: MixerTrack/MixerInsert interface
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

export const AudioModule = defineModule<IMainThreadContext, AudioModuleState>({
  name: "audio",
  async create(ctx, { waitForMessage }) {
    const audioCtx = new AudioContext();

    const mainGain = new GainNode(audioCtx);
    mainGain.connect(audioCtx.destination);

    const sampleGain = new GainNode(audioCtx);
    sampleGain.connect(mainGain);

    const { sharedAudioState } = await waitForMessage(Thread.Game, AudioMessageType.InitializeAudioState);

    audioCtx.listener

    return {
      sharedAudioState,
      context: audioCtx,
      peerMediaStreamSourceMap: new Map(),
      main: {
        gain: mainGain,
      },
      sample: {
        gain: sampleGain,
      },

      streamMap: new Map(),
      audio: LocalAudio[];
      sources: LocalAudioSource[];
      globalEmitters: LocalGlobalAudioEmitter[];
      positionalEmitters: LocalPositionalAudioEmitter[];
    };
  },
  init(ctx) {
    const audio = getModule(ctx, AudioModule);

    preloadDefaultAudio(audio);

    const disposables = [
      registerMessageHandler(ctx, AudioMessageType.PlayAudio, onPlayAudio),
      registerMessageHandler(ctx, AudioMessageType.SetAudioListener, onSetAudioListener),
      registerMessageHandler(ctx, AudioMessageType.SetAudioPeerEntity, onSetAudioPeerEntity),
      registerResourceLoader(ctx, AudioSourceResourceType, onLoadAudioSource),
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
  audioState: AudioModuleState,
  eid: number,
  panner: PannerNode = new PannerNode(audioState.context)
) => {
  panner.panningModel = "HRTF";
  panner.connect(audioState.sample.gain);
  audioState.entityPanners.set(eid, panner);
  return panner;
};

export const preloadDefaultAudio = async (
  audioState: AudioModuleState,
  defaultAudioFiles: string[] = ["/audio/bach.mp3", "/audio/hit.wav"]
) => {
  defaultAudioFiles.forEach(async (file) => await getAudioBuffer(audioState, file));
};

const isChrome = /Chrome/.test(navigator.userAgent);

export const setPeerMediaStream = (audioState: AudioModuleState, peerId: string, mediaStream: MediaStream) => {
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
  { context, sample: { cache } }: AudioModuleState,
  filepath: string
): Promise<AudioBuffer> => {
  if (cache.has(filepath)) return cache.get(filepath) as AudioBuffer;

  const audioBuffer = await fetchAudioBuffer(context, filepath);
  cache.set(filepath, audioBuffer);

  return audioBuffer;
};

const rndRange = (min: number, max: number) => Math.random() * (max - min) + min;

export const playAudioBuffer = (
  { context, sample: { gain } }: AudioModuleState,
  audioBuffer: AudioBuffer,
  out: AudioNode = gain
) => {
  const sampleSource = context.createBufferSource();
  sampleSource.buffer = audioBuffer;
  sampleSource.playbackRate.value = rndRange(0.25, 0.75);
  sampleSource.connect(out);
  sampleSource.start();
  return sampleSource;
};

export const playAudioAtEntity = async (audioState: AudioModuleState, filepath: string, eid: number) => {
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

interface LocalAudio {
  resourceId: ResourceId;
  audio: AudioBuffer | HTMLAudioElement;
}

const MAX_AUDIO_BUFFER_SIZE = 640_000;

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

export const onLoadAudio = async (
  ctx: IMainThreadContext,
  resourceId: ResourceId,
  props: AudioResourceProps
): Promise<LocalAudio> => {
  const audioModule = getModule(ctx, AudioModule);

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

  let audio: AudioBuffer | HTMLAudioElement;

  if (buffer.byteLength > MAX_AUDIO_BUFFER_SIZE) {
    const objectUrl = URL.createObjectURL(new Blob([buffer], { type: mimeType }));

    const audioEl = new Audio();

    await new Promise((resolve, reject) => {
      audioEl.onload = resolve;
      audioEl.onerror = reject;
      audioEl.src = objectUrl;
    });

    audio = audioEl;
  } else {
    audio = await audioModule.context.decodeAudioData(buffer);
  }

  audioModule.sample.cache.set(resourceId, audio);

  return {
    resourceId,
    audio,
  };
};

export const onLoadAudioStream = async (
  ctx: IMainThreadContext,
  resourceId: ResourceId,
  { streamId }: AudioStreamProps
): Promise<LocalAudio> => {
  const audioModule = getModule(ctx, AudioModule);

  const mediaStream = audioModule.streamMap.get(streamId);

  if (!mediaStream) {
    throw new Error(`Media stream not found for streamId: ${streamId}`);
  }

  const audioStream: LocalAudioStream = {
    resourceId,
    streamId,
    mediaStream,
  };

  audioModule.

  return audioModule;
};

interface LocalAudioSource {
  resourceId: ResourceId;
  audio: LocalAudio;
  sourceNode: AudioBufferSourceNode | MediaElementAudioSourceNode;
  gainNode: GainNode;
  autoPlay: boolean;
  playing: boolean;
  loop: boolean;
  currentTime: number;
}

export const onLoadAudioSource = async (
  ctx: IMainThreadContext,
  resourceId: ResourceId,
  props: AudioSourceResourceProps
): Promise<LocalAudioSource> => {
  const audioModule = getModule(ctx, AudioModule);

  const localAudio = await waitForLocalResource<LocalAudio>(ctx, props.audio);

  let sourceNode: AudioBufferSourceNode | MediaElementAudioSourceNode;

  if (localAudio.audio instanceof AudioBuffer) {
    const bufferSourceNode = audioModule.context.createBufferSource();
    bufferSourceNode.buffer = localAudio.audio;
    sourceNode = bufferSourceNode;
  } else {
    const el = localAudio.audio.cloneNode() as HTMLAudioElement;
    sourceNode = audioModule.context.createMediaElementSource(el);
  }

  const gainNode = audioModule.context.createGain();
  gainNode.gain.value = props.gain;
  sourceNode.connect(gainNode);

  return {
    resourceId,
    audio: localAudio,
    sourceNode,
    gainNode,
    autoPlay: props.autoPlay,
    loop: props.loop,
    playing: false,
    currentTime: 0,
  };
};

interface LocalPositionalAudioEmitter {
  resourceId: ResourceId;
  audioSources: LocalAudioSource[];
  pannerNode: PannerNode;
  gainNode: GainNode;
  sharedPositionalAudioEmitter: SharedPositionalAudioEmitter;
}

export const onLoadPositionalAudioEmitter = async (
  ctx: IMainThreadContext,
  resourceId: ResourceId,
  props: PositionalAudioEmitterResourceProps
): Promise<LocalPositionalAudioEmitter> => {
  const audio = getModule(ctx, AudioModule);

  const audioSources = await Promise.all(
    props.sources.map((sourceId) => waitForLocalResource<LocalAudioSource>(ctx, sourceId))
  );

  const pannerNode = audio.context.createPanner();

  const gainNode = audio.context.createGain();
  gainNode.gain.value = props.gain;
  pannerNode.connect(gainNode);

  for (const source of audioSources) {
    source.gainNode.connect(pannerNode);
  }

  gainNode.connect(audio.main.gain);

  pannerNode.coneInnerAngle = props.coneInnerAngle;
  pannerNode.coneOuterAngle = props.coneOuterAngle;
  pannerNode.coneOuterGain = props.coneOuterGain;
  pannerNode.distanceModel = AudioEmitterDistanceModelMap[props.distanceModel];
  pannerNode.maxDistance = props.maxDistance;
  pannerNode.refDistance = props.refDistance;
  pannerNode.rolloffFactor = props.rolloffFactor;
  pannerNode.panningModel = "HRTF";

  return {
    resourceId,
    audioSources,
    pannerNode,
    gainNode,
  };
};

interface LocalGlobalAudioEmitter {
  resourceId: ResourceId;
  audioSources: LocalAudioSource[];
  gainNode: GainNode;
}

export const onLoadGlobalAudioEmitter = async (
  ctx: IMainThreadContext,
  resourceId: ResourceId,
  props: PositionalAudioEmitterResourceProps
): Promise<LocalGlobalAudioEmitter> => {
  const audio = getModule(ctx, AudioModule);

  const audioSources = await Promise.all(
    props.sources.map((sourceId) => waitForLocalResource<LocalAudioSource>(ctx, sourceId))
  );

  const gainNode = audio.context.createGain();
  gainNode.gain.value = props.gain;
  gainNode.connect(audio.main.gain);

  return {
    resourceId,
    audioSources,
    gainNode,
  };
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

/***********
 * Systems *
 **********/

const tempPosition = vec3.create();
const tempQuaternion = quat.create();
const tempScale = vec3.create();

export function MainThreadAudioSystem(mainThread: IMainThreadContext) {
  const audioModule = getModule(mainThread, AudioModule);

  if (audioModule.sharedAudioState.activeListenerResourceId[0] !== NOOP) {
    setAudioListenerTransform(audioModule.context.listener, audioModule.sharedAudioState.activeListenerWorldMatrix);
  }

  const { currentTime } = audioModule.context;

  for (let i = 0; i < audioModule.positionalEmitters.length; i++) {
    const positionalEmitter = audioModule.positionalEmitters[i];
    const { pannerNode, sharedPositionalAudioEmitter } = positionalEmitter;

    mat4.getTranslation(tempPosition, sharedPositionalAudioEmitter.worldMatrix);
    pannerNode.positionX.setValueAtTime(tempPosition[0], currentTime);
    pannerNode.positionY.setValueAtTime(tempPosition[1], currentTime);
    pannerNode.positionZ.setValueAtTime(tempPosition[2], currentTime);

    // TODO: Set other panner node props

    pannerNode.coneInnerAngle = sharedPositionalAudioEmitter.coneInnerAngle[0];
    pannerNode.coneOuterAngle = sharedPositionalAudioEmitter.coneOuterAngle[0];
    pannerNode.coneOuterGain = sharedPositionalAudioEmitter.coneOuterGain[0];
    pannerNode.distanceModel = AudioEmitterDistanceModelMap[sharedPositionalAudioEmitter.distanceModel[0]];
    pannerNode.maxDistance = sharedPositionalAudioEmitter.maxDistance[0];
    pannerNode.refDistance = sharedPositionalAudioEmitter.refDistance[0];
    pannerNode.rolloffFactor = sharedPositionalAudioEmitter.rolloffFactor[0];
  }
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
    listener.positionZ.value = tempPosition[2]
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