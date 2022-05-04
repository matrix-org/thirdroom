import { pipe } from "bitecs";
import { Matrix4, Quaternion, Vector3 } from "three";

import { addView, addViewMatrix4, createCursorBuffer } from "../allocator/CursorBuffer";
import { maxEntities, NOOP } from "../config";
import { TransformView } from "../RenderWorker";
import { createTripleBuffer, getReadBufferIndex, swapReadBuffer, TripleBufferState } from "../TripleBuffer";
import { WorkerMessageType } from "../WorkerMessage";

/* Types */

export interface AudioState {
  context: AudioContext;
  tripleBuffer: TripleBufferState;
  transformViews: TransformView[];
  entityPanners: Map<number, PannerNode>;
  playerEntity: number;
  master: {
    bus: ChannelMergerNode;
    gain: GainNode;
  };
  sample: {
    bus: ChannelMergerNode;
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
  { context, sample: { cache } }: AudioState,
  filepath: string
): Promise<AudioBuffer> => {
  if (cache.has(filepath)) return cache.get(filepath) as AudioBuffer;

  const audioBuffer = await fetchAudioBuffer(context, filepath);
  cache.set(filepath, audioBuffer);

  return audioBuffer;
};

export const queueAudioBuffer = (audioState: AudioState, filename: string, eid?: number) => {
  audioState.sample.queue.push([filename, eid]);
};

export const playAudioBuffer = (
  { context, sample: { bus, gain } }: AudioState,
  audioBuffer: AudioBuffer,
  out: AudioNode = gain
) => {
  const sampleSource = context.createBufferSource();
  sampleSource.buffer = audioBuffer;
  sampleSource.playbackRate.value = 1;
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

export const playAudio = async (audioState: AudioState, filepath: string, eid: number = NOOP) => {
  if (eid !== NOOP) {
    playAudioAtEntity(audioState, filepath, eid);
    return;
  }
  const audioBuffer = await getAudioBuffer(audioState, filepath);
  if (audioBuffer) playAudioBuffer(audioState, audioBuffer);
  else console.error(`error: could not play audio ${filepath} - audio buffer not found`);
};

export const playAudioAtEntity = async (audioState: AudioState, filepath: string, eid: number) => {
  const audioBuffer = await getAudioBuffer(audioState, filepath);
  if (audioBuffer) {
    if (!audioState.entityPanners.has(eid)) addEntityPanner(audioState, eid);
    const panner = audioState.entityPanners.get(eid);
    playAudioBuffer(audioState, audioBuffer, panner);
  } else console.error(`error: could not play audio ${filepath} - audio buffer not found`);
};

export const preloadDefaultAudio = async (
  audioState: AudioState,
  defaultAudioFiles: string[] = ["/audio/cricket.ogg"]
) => {
  defaultAudioFiles.forEach(async (file) => await getAudioBuffer(audioState, file));
};

export const addEntityPanner = (
  audioState: AudioState,
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
│ master │ master channel volume
│ gain   │ todo: connect reverb gain
└─L────R─┘
  ▲    ▲
┌────────┐
│ sample │ sample channel volume
│ gain   │
└─L────R─┘
 */
export const createAudioState = (): AudioState => {
  const context = new AudioContext();

  const masterGain = new GainNode(context);
  const masterBus = new ChannelMergerNode(context);
  masterGain.connect(context.destination);
  // masterBus.connect(masterGain);

  const sampleBus = new ChannelMergerNode(context);
  const sampleGain = new GainNode(context);
  // sampleBus.connect(sampleGain);
  // sampleGain.connect(masterBus);
  sampleGain.connect(masterGain);

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
    playerEntity: NOOP,
    master: {
      bus: masterBus,
      gain: masterGain,
    },
    sample: {
      bus: sampleBus,
      gain: sampleGain,
      cache: sampleCache,
      queue: sampleQueue,
    },
  };
};

export const disposeAudioState = (audioState: AudioState) => {
  audioState.context.close();
};

/* Systems */

const tempMatrix4 = new Matrix4();
const tempPosition = new Vector3();
const tempQuaternion = new Quaternion();
const tempScale = new Vector3();
export const updatePannerPositions = (audioState: AudioState) => {
  audioState.playerEntity = 67;

  swapReadBuffer(audioState.tripleBuffer);
  const Transform = audioState.transformViews[getReadBufferIndex(audioState.tripleBuffer)];

  tempMatrix4
    .fromArray(Transform.worldMatrix[audioState.playerEntity])
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
  const v = new Vector3(-e[8], -e[9], -e[10]).normalize();
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

export const playQueuedAudio = (audioState: AudioState) => {
  const {
    sample: { queue },
  } = audioState;
  while (queue.length) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const [filepath, eid] = queue.shift()!;
    if (eid) playAudioAtEntity(audioState, filepath, eid);
    else playAudio(audioState, filepath);
  }
  return audioState;
};

export const audioSystem: (audioState: AudioState) => AudioState = pipe(updatePannerPositions, playQueuedAudio);
