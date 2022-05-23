import { Matrix4, Quaternion, Vector3 } from "three";

import { addView, addViewMatrix4, createCursorBuffer } from "../allocator/CursorBuffer";
import { maxEntities, NOOP } from "../config.common";
import { IMainThreadContext } from "../MainThread";
import { TransformView } from "../RenderWorker";
import { createTripleBuffer, getReadBufferIndex, swapReadBuffer, TripleBufferState } from "../TripleBuffer";
import { getScope, registerMessageHandler, registerSystem } from "../module/module.common";
import { AudioMessageType, PlayAudioMessage, SetAudioListenerMessage, SetAudioPeerEntityMessage } from "./audio.common";

/*********
 * Types *
 ********/

export interface IAudioScope {
  context: AudioContext;
  tripleBuffer: TripleBufferState;
  transformViews: TransformView[];
  entityPanners: Map<number, PannerNode>;
  listenerEntity: number;
  peerEntities: Map<string, number>;
  peerMediaStreamSourceMap: Map<string, MediaStreamAudioSourceNode>;
  main: {
    gain: GainNode;
  };
  sample: {
    gain: GainNode;
    cache: Map<string, AudioBuffer>;
    queue: [string, number?][];
  };
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
export function AudioScope(ctx: IMainThreadContext): IAudioScope {
  const audioCtx = new AudioContext();

  const mainGain = new GainNode(audioCtx);
  mainGain.connect(audioCtx.destination);

  const sampleGain = new GainNode(audioCtx);
  sampleGain.connect(mainGain);

  const sampleCache = new Map<string, AudioBuffer>();

  const tripleBuffer = createTripleBuffer();
  const cursorBuffers = tripleBuffer.buffers.map((b) => createCursorBuffer(b));
  const transformViews = cursorBuffers.map(
    (buffer) =>
      ({
        // note: needs synced with renderableBuffer properties in game worker
        // todo: abstract the need to sync structure with renderableBuffer properties
        worldMatrix: addViewMatrix4(buffer, maxEntities),
        worldMatrixNeedsUpdate: addView(buffer, Uint8Array, maxEntities),
      } as TransformView)
  );

  const entityPanners = new Map<number, PannerNode>();

  const sampleQueue: [string, number][] = [];

  return {
    context: audioCtx,
    tripleBuffer,
    transformViews,
    entityPanners,
    listenerEntity: NOOP,
    peerEntities: new Map(),
    peerMediaStreamSourceMap: new Map(),
    main: {
      gain: mainGain,
    },
    sample: {
      gain: sampleGain,
      cache: sampleCache,
      queue: sampleQueue,
    },
  };
}

export async function AudioModule(ctx: IMainThreadContext) {
  const audio = getScope(ctx, AudioScope);

  ctx.initialGameWorkerState.audioTripleBuffer = audio.tripleBuffer;

  preloadDefaultAudio(audio);

  const disposables = [
    registerMessageHandler(ctx, AudioMessageType.PlayAudio, onPlayAudio),
    registerMessageHandler(ctx, AudioMessageType.SetAudioListener, onSetAudioListener),
    registerMessageHandler(ctx, AudioMessageType.SetAudioPeerEntity, onSetAudioPeerEntity),

    registerSystem(ctx, MainAudioSystem),
  ];

  return () => {
    audio.context.close();

    for (const dispose of disposables) {
      dispose();
    }
  };
}

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
  audioState: IAudioScope,
  eid: number,
  panner: PannerNode = new PannerNode(audioState.context)
) => {
  panner.panningModel = "HRTF";
  panner.connect(audioState.sample.gain);
  audioState.entityPanners.set(eid, panner);
};

export const preloadDefaultAudio = async (
  audioState: IAudioScope,
  defaultAudioFiles: string[] = ["/audio/bach.mp3", "/audio/hit.wav"]
) => {
  defaultAudioFiles.forEach(async (file) => await getAudioBuffer(audioState, file));
};

const isChrome = !!window.chrome;

export const setPeerMediaStream = (audioState: IAudioScope, peerId: string, mediaStream: MediaStream) => {
  // https://bugs.chromium.org/p/chromium/issues/detail?id=933677
  if (isChrome) {
    const audioEl = new Audio();
    audioEl.srcObject = mediaStream;
    audioEl.setAttribute("autoplay", "autoplay");
    audioEl.muted = true;
  }

  const mediaStreamSource = audioState.context.createMediaStreamSource(mediaStream);
  audioState.peerMediaStreamSourceMap.set(peerId, mediaStreamSource);
};

export const fetchAudioBuffer = async (ctx: AudioContext, filepath: string) => {
  const response = await fetch(filepath);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
  return audioBuffer;
};

export const getAudioBuffer = async (
  { context, sample: { cache } }: IAudioScope,
  filepath: string
): Promise<AudioBuffer> => {
  if (cache.has(filepath)) return cache.get(filepath) as AudioBuffer;

  const audioBuffer = await fetchAudioBuffer(context, filepath);
  cache.set(filepath, audioBuffer);

  return audioBuffer;
};

const rndRange = (min: number, max: number) => Math.random() * (max - min) + min;

export const playAudioBuffer = (
  { context, sample: { gain } }: IAudioScope,
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

export const playAudioAtEntity = async (audioState: IAudioScope, filepath: string, eid: number) => {
  const audioBuffer = await getAudioBuffer(audioState, filepath);
  if (audioBuffer) {
    if (!audioState.entityPanners.has(eid)) addEntityPanner(audioState, eid);
    const panner = audioState.entityPanners.get(eid);
    playAudioBuffer(audioState, audioBuffer, panner);
  } else console.error(`error: could not play audio ${filepath} - audio buffer not found`);
};

/********************
 * Message Handlers *
 *******************/

export const onPlayAudio = async (mainThread: IMainThreadContext, message: PlayAudioMessage) => {
  const audioScope = getScope(mainThread, AudioScope);
  const { filepath, eid } = message;

  if (eid !== NOOP) {
    playAudioAtEntity(audioScope, filepath, eid);
    return;
  }
  const audioBuffer = await getAudioBuffer(audioScope, filepath);
  if (audioBuffer) playAudioBuffer(audioScope, audioBuffer);
  else console.error(`error: could not play audio ${filepath} - audio buffer not found`);
};

// sets the entity that the listener is positioned at
export const onSetAudioListener = (mainThread: IMainThreadContext, message: SetAudioListenerMessage) => {
  const audioScope = getScope(mainThread, AudioScope);
  audioScope.listenerEntity = message.eid;
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
  const audioScope = getScope(mainThread, AudioScope);
  const { peerId, eid } = message;

  audioScope.peerEntities.set(peerId, eid);

  const mediaStreamSource = audioScope.peerMediaStreamSourceMap.get(peerId);
  if (!mediaStreamSource)
    return console.error("could not setAudioPeerEntity - mediaStreamSource not found for peer", peerId);

  const panner = audioScope.entityPanners.get(eid);
  if (!panner) return console.error("could not setAudioPeerEntity - panner not found for eid", eid, "peerId", peerId);

  mediaStreamSource.connect(panner);
};

/***********
 * Systems *
 **********/

const tempMatrix4 = new Matrix4();
const tempPosition = new Vector3();
const tempQuaternion = new Quaternion();
const tempScale = new Vector3();
export function MainAudioSystem(mainThread: IMainThreadContext) {
  const audioScope = getScope(mainThread, AudioScope);

  if (audioScope.listenerEntity === NOOP) {
    return audioScope;
  }

  swapReadBuffer(audioScope.tripleBuffer);
  const Transform = audioScope.transformViews[getReadBufferIndex(audioScope.tripleBuffer)];

  tempMatrix4
    .fromArray(Transform.worldMatrix[audioScope.listenerEntity])
    .decompose(tempPosition, tempQuaternion, tempScale);

  if (isNaN(tempQuaternion.x)) {
    return audioScope;
  }

  const { listener } = audioScope.context;

  if (listener.upX) {
    listener.upX.value = 0;
    listener.upY.value = 1;
    listener.upZ.value = 0;
  }

  if (listener.positionX) {
    listener.positionX.value = tempPosition.x;
    listener.positionY.value = tempPosition.y;
    listener.positionZ.value = tempPosition.z;
  } else {
    listener.setPosition(tempPosition.x, tempPosition.y, tempPosition.z);
  }

  const e = tempMatrix4.elements;
  const v = tempPosition.set(-e[8], -e[9], -e[10]).normalize();
  if (listener.forwardX) {
    listener.forwardX.value = v.x;
    listener.forwardY.value = v.y;
    listener.forwardZ.value = v.z;
  } else {
    listener.setOrientation(v.x, v.y, v.z, 0, 1, 0);
  }

  audioScope.entityPanners.forEach((panner, eid) => {
    const { currentTime } = audioScope.context;

    tempMatrix4.fromArray(Transform.worldMatrix[eid]).decompose(tempPosition, tempQuaternion, tempScale);

    panner.positionX.setValueAtTime(tempPosition.x, currentTime);
    panner.positionY.setValueAtTime(tempPosition.y, currentTime);
    panner.positionZ.setValueAtTime(tempPosition.z, currentTime);
  });
}
