import { pipe } from "bitecs";
import { Matrix4, Quaternion, Vector3 } from "three";

import { addView, addViewMatrix4, createCursorBuffer } from "../allocator/CursorBuffer";
import { maxEntities, NOOP } from "../config";
import { MainThreadState } from "../MainThread";
import { TransformView } from "../RenderThread";
import { createTripleBuffer, getReadBufferIndex, swapReadBuffer, TripleBufferState } from "../TripleBuffer";
import { MainThreadModule } from "../types/types.main";
import { WorkerMessages, WorkerMessageType } from "../WorkerMessage";

/* Types */

export interface MainThreadAudioState {
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

/* API */

export const fetchAudioBuffer = async (ctx: AudioContext, filepath: string) => {
  const response = await fetch(filepath);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
  return audioBuffer;
};

export const getAudioBuffer = async (
  { context, sample: { cache } }: MainThreadAudioState,
  filepath: string
): Promise<AudioBuffer> => {
  if (cache.has(filepath)) return cache.get(filepath) as AudioBuffer;

  const audioBuffer = await fetchAudioBuffer(context, filepath);
  cache.set(filepath, audioBuffer);

  return audioBuffer;
};

export const queueAudioBuffer = (audioState: MainThreadAudioState, filename: string, eid?: number) => {
  audioState.sample.queue.push([filename, eid]);
};

const rndRange = (min: number, max: number) => Math.random() * (max - min) + min;

export const playAudioBuffer = (
  { context, sample: { gain } }: MainThreadAudioState,
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

export const playAudioFromWorker = (filepath: string, eid: number = NOOP) =>
  postMessage({
    type: WorkerMessageType.PlayAudio,
    filepath,
    eid,
  });

export const playAudio = async (audioState: MainThreadAudioState, filepath: string, eid: number = NOOP) => {
  if (eid !== NOOP) {
    playAudioAtEntity(audioState, filepath, eid);
    return;
  }
  const audioBuffer = await getAudioBuffer(audioState, filepath);
  if (audioBuffer) playAudioBuffer(audioState, audioBuffer);
  else console.error(`error: could not play audio ${filepath} - audio buffer not found`);
};

export const playAudioAtEntity = async (audioState: MainThreadAudioState, filepath: string, eid: number) => {
  const audioBuffer = await getAudioBuffer(audioState, filepath);
  if (audioBuffer) {
    if (!audioState.entityPanners.has(eid)) addEntityPanner(audioState, eid);
    const panner = audioState.entityPanners.get(eid);
    playAudioBuffer(audioState, audioBuffer, panner);
  } else console.error(`error: could not play audio ${filepath} - audio buffer not found`);
};

export const addEntityPanner = (
  audioState: MainThreadAudioState,
  eid: number,
  panner: PannerNode = new PannerNode(audioState.context)
) => {
  panner.panningModel = "HRTF";
  panner.connect(audioState.sample.gain);
  audioState.entityPanners.set(eid, panner);
};

// todo: MixerTrack/MixerInsert interface
/*
┌────────┐
│  out   │ audio context destination
│        │
└─L────R─┘
  ▲    ▲
┌────────┐
│ main   │ main channel volume
│ gain   │ todo: connect reverb gain
└─L────R─┘
  ▲    ▲
┌────────┐
│ sample │ sample channel volume
│ gain   │
└─L────R─┘
 */
export const createAudioState = (): MainThreadAudioState => {
  const context = new AudioContext();

  const mainGain = new GainNode(context);
  mainGain.connect(context.destination);

  const sampleGain = new GainNode(context);
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
    context,
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
};

export const preloadDefaultAudio = async (
  audioState: MainThreadAudioState,
  defaultAudioFiles: string[] = ["/audio/bach.mp3", "/audio/hit.wav"]
) => {
  defaultAudioFiles.forEach(async (file) => await getAudioBuffer(audioState, file));
};

export const setAudioListener = (audioState: MainThreadAudioState, eid: number) => {
  audioState.listenerEntity = eid;
};

export const setAudioPeerEntity = (audioState: MainThreadAudioState, peerId: string, eid: number) => {
  audioState.peerEntities.set(peerId, eid);

  const mediaStreamSource = audioState.peerMediaStreamSourceMap.get(peerId);
  if (!mediaStreamSource)
    return console.error("could not setAudioPeerEntity - mediaStreamSource not found for peer", peerId);

  const panner = audioState.entityPanners.get(eid);
  if (!panner) return console.error("could not setAudioPeerEntity - panner not found for eid", eid, "peerId", peerId);

  mediaStreamSource.connect(panner);
};

const isChrome = !!window.chrome;

export const setPeerMediaStream = (audioState: MainThreadAudioState, peerId: string, mediaStream: MediaStream) => {
  if (isChrome) {
    // https://bugs.chromium.org/p/chromium/issues/detail?id=933677
    const audioEl = new Audio();
    audioEl.srcObject = mediaStream;
    audioEl.setAttribute("autoplay", "autoplay");
    audioEl.muted = true;
  }

  const mediaStreamSource = audioState.context.createMediaStreamSource(mediaStream);
  audioState.peerMediaStreamSourceMap.set(peerId, mediaStreamSource);
};

export const bindAudioStateEvents = (audioState: MainThreadAudioState, gameWorker: Worker) => {
  // todo: register messages on a single event listener
  gameWorker.addEventListener("message", ({ data }) => {
    if (typeof data !== "object") {
      return;
    }

    const message = data as WorkerMessages;

    switch (message.type) {
      case WorkerMessageType.PlayAudio:
        playAudio(audioState, message.filepath, message.eid);
        break;
      case WorkerMessageType.SetAudioListener:
        setAudioListener(audioState, message.eid);
        break;
      case WorkerMessageType.SetAudioPeerEntity:
        setAudioPeerEntity(audioState, message.peerId, message.eid);
        break;
    }
  });
};

export async function initAudioState(state: MainThreadState) {
  preloadDefaultAudio(state.audio);
  bindAudioStateEvents(state.audio, state.gameWorker);
}

export const disposeAudioState = (state: MainThreadState) => {
  state.audio.context.close();
};

/* Main Thread Systems */

const tempMatrix4 = new Matrix4();
const tempPosition = new Vector3();
const tempQuaternion = new Quaternion();
const tempScale = new Vector3();
export const updatePannerPositions = (audioState: MainThreadAudioState) => {
  if (audioState.listenerEntity === NOOP) {
    return audioState;
  }

  swapReadBuffer(audioState.tripleBuffer);
  const Transform = audioState.transformViews[getReadBufferIndex(audioState.tripleBuffer)];

  tempMatrix4
    .fromArray(Transform.worldMatrix[audioState.listenerEntity])
    .decompose(tempPosition, tempQuaternion, tempScale);

  if (isNaN(tempQuaternion.x)) {
    return audioState;
  }

  const { listener } = audioState.context;

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

  audioState.entityPanners.forEach((panner, eid) => {
    const { currentTime } = audioState.context;

    tempMatrix4.fromArray(Transform.worldMatrix[eid]).decompose(tempPosition, tempQuaternion, tempScale);

    panner.positionX.setValueAtTime(tempPosition.x, currentTime);
    panner.positionY.setValueAtTime(tempPosition.y, currentTime);
    panner.positionZ.setValueAtTime(tempPosition.z, currentTime);
  });

  return audioState;
};

export const playQueuedAudio = (audioState: MainThreadAudioState) => {
  const {
    sample: { queue },
  } = audioState;
  while (queue.length) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const [filepath, eid] = queue.shift()!;
    playAudio(audioState, filepath, eid);
  }
  return audioState;
};

export const mainAudioSystem: (audioState: MainThreadAudioState) => MainThreadAudioState = pipe(
  updatePannerPositions,
  playQueuedAudio
);

export default {
  create: createAudioState,
  init: initAudioState,
  dispose: disposeAudioState,
};
