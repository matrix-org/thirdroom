import { vec3, quat, mat4 } from "gl-matrix";

import { IMainThreadContext } from "../MainThread";
import { defineModule, getModule, Thread } from "../module/module.common";
import {
  AudioResourceType,
  AudioMessageType,
  AudioResourceProps,
  AudioStateTripleBuffer,
  PositionalAudioEmitterTripleBuffer,
  GlobalAudioEmitterTripleBuffer,
  InitializeAudioStateMessage,
  MediaStreamSourceTripleBuffer,
  SharedMediaStreamResource,
  SharedAudioSourceResource,
  ReadAudioSourceTripleBuffer,
  WriteAudioSourceTripleBuffer,
  AudioEmitterType,
  SharedAudioEmitterResource,
} from "./audio.common";
import { getLocalResource, registerResourceLoader, waitForLocalResource } from "../resource/resource.main";
import { ResourceId } from "../resource/resource.common";
import { LocalBufferView } from "../bufferView/bufferView.common";
import { AudioNodeTripleBuffer, NodeResourceType } from "../node/node.common";
import { MainNode, onLoadMainNode } from "../node/node.main";
import {
  getReadObjectBufferView,
  getWriteObjectBufferView,
  ReadObjectTripleBufferView,
} from "../allocator/ObjectBufferView";
import { MainScene, onLoadMainSceneResource, updateMainSceneResources } from "../scene/scene.main";
import { SceneResourceType } from "../scene/scene.common";

/*********
 * Types *
 ********/

export interface MainAudioModule {
  audioStateTripleBuffer: AudioStateTripleBuffer;
  context: AudioContext;
  // todo: MixerTrack/MixerInsert interface
  mainGain: GainNode;
  sampleGain: GainNode;
  // voiceGain: GainNode;
  // ambientGain: GainNode;
  mediaStreams: Map<string, MediaStream>;
  datum: LocalAudioData[];
  sources: LocalAudioSource[];
  mediaStreamSources: LocalMediaStreamSource[];
  emitters: LocalAudioEmitter[];
  nodes: MainNode[];
  scenes: MainScene[];
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

    const { audioStateTripleBuffer } = await waitForMessage<InitializeAudioStateMessage>(
      Thread.Game,
      AudioMessageType.InitializeAudioState
    );

    audioCtx.listener;

    return {
      audioStateTripleBuffer,
      context: audioCtx,
      mainGain: mainGain,
      sampleGain: sampleGain,
      // voiceGain: voiceGain,
      // ambientGain: ambientGain,
      mediaStreams: new Map(),
      datum: [],
      sources: [],
      mediaStreamSources: [],
      globalEmitters: [],
      positionalEmitters: [],
      emitters: [],
      nodes: [],
      scenes: [],
    };
  },
  init(ctx) {
    const audio = getModule(ctx, AudioModule);

    const disposables = [
      registerResourceLoader(ctx, NodeResourceType, onLoadMainNode),
      registerResourceLoader(ctx, SceneResourceType, onLoadMainSceneResource),
      registerResourceLoader(ctx, AudioResourceType.AudioData, onLoadAudioData),
      registerResourceLoader(ctx, AudioResourceType.AudioSource, onLoadAudioSource),
      registerResourceLoader(ctx, AudioResourceType.MediaStream, onLoadMediaStream),
      registerResourceLoader(ctx, AudioResourceType.MediaStreamSource, onLoadMediaStreamSource),
      registerResourceLoader(ctx, AudioResourceType.AudioEmitter, onLoadAudioEmitter),
    ];

    return () => {
      audio.context.close();

      for (const dispose of disposables) {
        dispose();
      }
    };
  },
});

/********************
 * Resource Handlers *
 *******************/

const onLoadAudioData = async (
  ctx: IMainThreadContext,
  resourceId: ResourceId,
  props: AudioResourceProps
): Promise<BaseLocalAudioData<any>> => {
  const audio = getModule(ctx, AudioModule);

  let buffer: ArrayBuffer;
  let mimeType: string;

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
  let type: AudioDataType;

  if (buffer.byteLength > MAX_AUDIO_BYTES) {
    const objectUrl = URL.createObjectURL(new Blob([buffer], { type: mimeType }));

    const audioEl = new Audio();

    await new Promise((resolve, reject) => {
      audioEl.oncanplaythrough = resolve;
      audioEl.onerror = reject;
      audioEl.src = objectUrl;
    });

    data = audioEl;
    type = AudioDataType.Element;
  } else {
    data = await audio.context.decodeAudioData(buffer);
    type = AudioDataType.Buffer;
  }

  return {
    resourceId,
    data,
    type,
  };
};

export interface LocalMediaStream {
  resourceId: ResourceId;
  streamId: string;
  stream: MediaStream;
}

async function onLoadMediaStream(
  ctx: IMainThreadContext,
  resourceId: ResourceId,
  { streamId }: SharedMediaStreamResource
) {
  const audioModule = getModule(ctx, AudioModule);

  const stream = audioModule.mediaStreams.get(streamId);

  if (!stream) {
    throw new Error(`Stream ${streamId} could not be found`);
  }

  return {
    resourceId,
    streamId,
    stream,
  };
}

export interface LocalMediaStreamSource {
  resourceId: ResourceId;
  mediaStream?: LocalMediaStream;
  mediaStreamSourceNode: SwappableMediaStreamAudioSourceNode;
  gainNode: GainNode;
  mediaStreamSourceTripleBuffer: MediaStreamSourceTripleBuffer;
}

const onLoadMediaStreamSource = async (
  ctx: IMainThreadContext,
  resourceId: ResourceId,
  mediaStreamSourceTripleBuffer: MediaStreamSourceTripleBuffer
): Promise<LocalMediaStreamSource> => {
  const audio = getModule(ctx, AudioModule);

  const mediaStreamSourceView = getReadObjectBufferView(mediaStreamSourceTripleBuffer);

  const mediaStream = mediaStreamSourceView.stream[0]
    ? await waitForLocalResource<LocalMediaStream>(ctx, mediaStreamSourceView.stream[0])
    : undefined;

  const mediaStreamSourceNode = createSwappableMediaStreamAudioSourceNode(audio.context, mediaStream?.stream);
  const gainNode = audio.context.createGain();
  mediaStreamSourceNode.connect(gainNode);

  const localMediaStreamSource: LocalMediaStreamSource = {
    resourceId,
    mediaStream,
    mediaStreamSourceNode,
    gainNode,
    mediaStreamSourceTripleBuffer,
  };

  audio.mediaStreamSources.push(localMediaStreamSource);

  return localMediaStreamSource;
};

interface LocalAudioSource {
  resourceId: ResourceId;
  data?: LocalAudioData;
  // Note: These types are swapped from the game thread.
  readAudioSourceTripleBuffer: WriteAudioSourceTripleBuffer;
  writeAudioSourceTripleBuffer: ReadAudioSourceTripleBuffer;
  sourceNode?: MediaElementAudioSourceNode | AudioBufferSourceNode;
  gainNode: GainNode;
}

export const onLoadAudioSource = async (
  ctx: IMainThreadContext,
  resourceId: ResourceId,
  { readAudioSourceTripleBuffer, writeAudioSourceTripleBuffer }: SharedAudioSourceResource
): Promise<LocalAudioSource> => {
  const audio = getModule(ctx, AudioModule);

  const audioSourceView = getReadObjectBufferView(writeAudioSourceTripleBuffer);

  const data = audioSourceView.audio[0]
    ? await waitForLocalResource<LocalAudioData>(ctx, audioSourceView.audio[0])
    : undefined;

  const gainNode = audio.context.createGain();

  const localAudioSource: LocalAudioSource = {
    resourceId,
    data,
    gainNode,
    readAudioSourceTripleBuffer: writeAudioSourceTripleBuffer,
    writeAudioSourceTripleBuffer: readAudioSourceTripleBuffer,
  };

  audio.sources.push(localAudioSource);

  return localAudioSource;
};

export type LocalEmitterSource = LocalAudioSource | LocalMediaStreamSource;

export interface BaseAudioEmitter<State> {
  type: AudioEmitterType;
  resourceId: ResourceId;
  sources: LocalEmitterSource[];
  gainNode: GainNode;
  emitterTripleBuffer: State;
}

export interface LocalGlobalAudioEmitter extends BaseAudioEmitter<GlobalAudioEmitterTripleBuffer> {
  type: AudioEmitterType.Global;
}

export interface LocalPositionalAudioEmitter extends BaseAudioEmitter<PositionalAudioEmitterTripleBuffer> {
  type: AudioEmitterType.Positional;
}

export type LocalAudioEmitter = LocalGlobalAudioEmitter | LocalPositionalAudioEmitter;

async function onLoadAudioEmitter(
  ctx: IMainThreadContext,
  resourceId: ResourceId,
  { type, emitterTripleBuffer }: SharedAudioEmitterResource
): Promise<LocalAudioEmitter> {
  const audioModule = getModule(ctx, AudioModule);

  const sharedGlobalAudioEmitterView = getReadObjectBufferView(emitterTripleBuffer);

  const sourcePromises: Promise<LocalAudioSource>[] = Array.from(sharedGlobalAudioEmitterView.sources)
    .filter((rid) => rid !== 0)
    .map((rid) => waitForLocalResource<LocalAudioSource>(ctx, rid));

  const sources = await Promise.all(sourcePromises);

  const gainNode = audioModule.context.createGain();
  gainNode.connect(audioModule.mainGain);

  const emitter: BaseAudioEmitter<any> = {
    type,
    resourceId,
    sources,
    gainNode,
    emitterTripleBuffer,
  };

  audioModule.emitters.push(emitter);

  return emitter;
}

/***********
 * Systems *
 **********/

export function MainThreadAudioSystem(ctx: IMainThreadContext) {
  const audioModule = getModule(ctx, AudioModule);

  const audioStateView = getReadObjectBufferView(audioModule.audioStateTripleBuffer);
  const activeScene = audioStateView.activeSceneResourceId[0];
  const activeSceneResource = getLocalResource<MainScene>(ctx, activeScene)?.resource;
  const activeAudioListener = audioStateView.activeAudioListenerResourceId[0];

  updateMediaStreamSources(ctx, audioModule);
  updateAudioSources(ctx, audioModule);
  updateAudioEmitters(ctx, audioModule);

  updateMainSceneResources(ctx, audioModule, activeSceneResource);

  for (let i = 0; i < audioModule.nodes.length; i++) {
    const node = audioModule.nodes[i];
    const nodeView = getReadObjectBufferView(node.audioNodeTripleBuffer);

    updateNodeAudioEmitter(ctx, audioModule, node, nodeView);

    if (node.resourceId === activeAudioListener) {
      setAudioListenerTransform(audioModule.context.listener, nodeView.worldMatrix);
    }
  }
}

interface SwappableMediaStreamAudioSourceNode {
  get mediaStream(): MediaStream | undefined;
  set mediaStream(value: MediaStream | undefined);
  connect(destinationNode: AudioNode, output?: number, input?: number): void;
  connect(destinationParam: AudioParam, output?: number): void;
  disconnect(): void;
  disconnect(output: number): void;
  disconnect(destination: AudioNode): void;
  disconnect(destination: AudioNode, output: number): void;
  disconnect(destination: AudioNode, output: number, input: number): void;
  disconnect(destination: AudioParam): void;
  disconnect(destination: AudioParam, output: number): void;
}

function createSwappableMediaStreamAudioSourceNode(
  context: AudioContext,
  initialMediaStream?: MediaStream
): SwappableMediaStreamAudioSourceNode {
  let node = initialMediaStream ? context.createMediaStreamSource(initialMediaStream) : undefined;

  let _mediaStream: MediaStream | undefined = initialMediaStream;

  const connections: {
    destination: AudioNode | AudioParam;
    output?: number | undefined;
    input?: number | undefined;
  }[] = [];

  function connect(destinationNode: AudioNode, output?: number, input?: number): void;
  function connect(destinationParam: AudioParam, output?: number): void;
  function connect(destination: AudioNode | AudioParam, output?: number, input?: number): void {
    if (
      // Note: this doesn't prevent connections that have different arguments but resolve to the same destination
      connections.some(
        (connection) =>
          connection.destination === destination && connection.output === output && connection.input === input
      )
    ) {
      return;
    }

    connections.push({ destination, output, input });

    if (node) {
      node.connect(destination as any, output, input);
    }
  }

  function disconnect(): void;
  function disconnect(output: number): void;
  function disconnect(destination: AudioNode): void;
  function disconnect(destination: AudioNode, output: number): void;
  function disconnect(destination: AudioNode, output: number, input: number): void;
  function disconnect(destination: AudioParam): void;
  function disconnect(destination: AudioParam, output: number): void;
  function disconnect(destination?: number | AudioNode | AudioParam, output?: number, input?: number): void {
    if (node) {
      node.disconnect(destination as any, output as any, input as any);
    }

    const connectionIndex = connections.findIndex(
      (connection) =>
        connection.destination === destination && connection.output === output && connection.input === input
    );

    if (connectionIndex !== -1) {
      connections.splice(connectionIndex, 1);
    }
  }

  return {
    get mediaStream(): MediaStream | undefined {
      return _mediaStream;
    },
    set mediaStream(value: MediaStream | undefined) {
      _mediaStream = value;

      if (node) {
        node.disconnect();
      }

      node = value ? context.createMediaStreamSource(value) : undefined;

      if (node) {
        for (const connection of connections) {
          node.connect(connection.destination as any, connection.output, connection.input);
        }
      }
    },
    connect,
    disconnect,
  };
}

function updateMediaStreamSources(ctx: IMainThreadContext, audioModule: MainAudioModule) {
  const localMediaStreamSources = audioModule.mediaStreamSources;

  for (let i = 0; i < localMediaStreamSources.length; i++) {
    const localMediaStreamSource = localMediaStreamSources[i];

    const mediaStreamSourceView = getReadObjectBufferView(localMediaStreamSource.mediaStreamSourceTripleBuffer);

    const currentMediaStreamResourceId = localMediaStreamSource.mediaStream?.resourceId || 0;
    const nextMediaStreamResourceId = mediaStreamSourceView.stream[0];

    if (currentMediaStreamResourceId !== nextMediaStreamResourceId) {
      const nextMediaStreamResource = getLocalResource<LocalMediaStream>(ctx, nextMediaStreamResourceId)?.resource;
      localMediaStreamSource.mediaStreamSourceNode.mediaStream = nextMediaStreamResource?.stream;
      localMediaStreamSource.mediaStream = nextMediaStreamResource;
    }

    localMediaStreamSource.gainNode.gain.value = mediaStreamSourceView.gain[0];
  }
}

function updateAudioSources(ctx: IMainThreadContext, audioModule: MainAudioModule) {
  const localAudioSources = audioModule.sources;

  for (let i = 0; i < localAudioSources.length; i++) {
    const localAudioSource = localAudioSources[i];

    const writeSourceView = getWriteObjectBufferView(localAudioSource.writeAudioSourceTripleBuffer);
    const readSourceView = getReadObjectBufferView(localAudioSource.readAudioSourceTripleBuffer);

    const currentAudioDataResourceId = localAudioSource.data?.resourceId || 0;
    const nextAudioDataResourceId = readSourceView.audio[0];

    // Dispose old sourceNode when changing audio data
    if (currentAudioDataResourceId !== nextAudioDataResourceId && localAudioSource.sourceNode) {
      localAudioSource.sourceNode.disconnect();
      localAudioSource.sourceNode = undefined;
    }

    localAudioSource.data = getLocalResource<LocalAudioData>(ctx, nextAudioDataResourceId)?.resource;

    if (!localAudioSource.data) {
      continue;
    }

    const currentAudioData = localAudioSource.data?.data;

    if (currentAudioData instanceof AudioBuffer) {
      const audioBuffer = currentAudioData as AudioBuffer;
      if (audioBuffer) {
        // One-shot audio buffer source
        if (readSourceView.play[0] && !readSourceView.loop[0]) {
          const sampleSource = audioModule.context.createBufferSource();
          sampleSource.connect(localAudioSource.gainNode);
          sampleSource.buffer = audioBuffer;
          sampleSource.playbackRate.value = readSourceView.playbackRate[0];

          // Connect the node to the audio emitters
          for (let i = 0; i < audioModule.emitters.length; i++) {
            const emitter = audioModule.emitters[i];

            if (emitter.sources.includes(localAudioSource)) {
              sampleSource.connect(emitter.gainNode);
            }
          }

          sampleSource.start();

          // For one-shots don't update the current time or playing state.
          writeSourceView.playing[0] = 0;
          writeSourceView.currentTime[0] = 0;

          // playing and looping
        } else if (readSourceView.play[0] && readSourceView.loop[0]) {
          writeSourceView.playing[0] = 1;

          if (localAudioSource.sourceNode) {
            (localAudioSource.sourceNode as AudioBufferSourceNode).stop();
          }

          const sampleSource = audioModule.context.createBufferSource();
          sampleSource.connect(localAudioSource.gainNode);
          sampleSource.buffer = audioBuffer;

          localAudioSource.sourceNode = sampleSource;
          sampleSource.playbackRate.value = readSourceView.playbackRate[0];
          sampleSource.loop = true;
          sampleSource.start();
        }

        // Stop
        if (!readSourceView.playing[0] && localAudioSource.sourceNode) {
          (localAudioSource.sourceNode as AudioBufferSourceNode).stop();
        }

        // Stop looping
        if (!readSourceView.loop[0] && localAudioSource.sourceNode) {
          (localAudioSource.sourceNode as AudioBufferSourceNode).loop = false;
        }
      }
    } else {
      // Create a new MediaElementSourceNode
      if (!localAudioSource.sourceNode) {
        const el = currentAudioData.cloneNode() as HTMLMediaElement;
        localAudioSource.sourceNode = audioModule.context.createMediaElementSource(el);
        localAudioSource.sourceNode.connect(localAudioSource.gainNode);
      }

      const mediaSourceNode = localAudioSource.sourceNode as MediaElementAudioSourceNode;
      const mediaEl = mediaSourceNode.mediaElement;

      if (readSourceView.play[0]) {
        mediaEl.playbackRate = readSourceView.playbackRate[0];
        mediaEl.loop = !!readSourceView.loop[0];
        mediaEl.currentTime = readSourceView.seek[0] < 0 ? 0 : readSourceView.seek[0];
        mediaEl.play();
        writeSourceView.playing[0] = 1;
        writeSourceView.currentTime[0] = mediaEl.currentTime;
      } else {
        if (readSourceView.playing[0]) {
          writeSourceView.playing[0] = 1;
          writeSourceView.currentTime[0] = mediaEl.currentTime;
        } else {
          if (!mediaEl.paused) {
            mediaEl.pause();
          }

          writeSourceView.playing[0] = 0;
          writeSourceView.currentTime[0] = mediaEl.currentTime;
        }

        // Seek will be -1 when not seeking this frame
        if (readSourceView.seek[0] >= 0) {
          mediaEl.currentTime = readSourceView.seek[0];
        }
      }
    }

    localAudioSource.gainNode.gain.value = readSourceView.gain[0];
  }
}

function updateAudioEmitters(ctx: IMainThreadContext, audioModule: MainAudioModule) {
  for (let i = 0; i < audioModule.emitters.length; i++) {
    const audioEmitter = audioModule.emitters[i];
    const emitterView = getReadObjectBufferView(audioEmitter.emitterTripleBuffer);

    const currentSources = audioEmitter.sources;
    const nextSources = emitterView.sources;

    // synchronize disconnections
    for (let j = currentSources.length - 1; j >= 0; j--) {
      const currentSource = currentSources[j];

      if (!nextSources.includes(currentSource.resourceId)) {
        currentSource.gainNode.disconnect(audioEmitter.gainNode);
        currentSources.splice(j, 1);
      }
    }

    // synchronize connections
    for (let j = 0; j < nextSources.length; j++) {
      const nextSourceRid = nextSources[j];

      let source = currentSources.find((s) => s.resourceId === nextSourceRid);

      if (!source) {
        source = getLocalResource<LocalEmitterSource>(ctx, nextSourceRid)?.resource;

        if (source) {
          source.gainNode.connect(audioEmitter.gainNode);
        }
      }
    }

    audioEmitter.gainNode.gain.value = emitterView.gain[0];
  }
}

const tempPosition = vec3.create();
const tempQuaternion = quat.create();
const tempScale = vec3.create();

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

export function updateNodeAudioEmitter(
  ctx: IMainThreadContext,
  audioModule: MainAudioModule,
  node: MainNode,
  nodeView: ReadObjectTripleBufferView<AudioNodeTripleBuffer>
) {
  // TODO: Implement this
}

// function updateLocalPositionalAudioEmitter(audio: MainAudioModule, node: MainNode) {
//   const { currentTime } = audio.context;
//   const { audioEmitterPannerNode: pannerNode, audioEmitter, audioSharedNode } = node;

//   const sharedAudio = getReadObjectBufferView(audioSharedNode);

//   const sharedEmitter = audioEmitter ? getReadObjectBufferView(audioEmitter.sharedPositionalAudioEmitter) : undefined;

//   if (!pannerNode) {
//     console.error("no panner node found for local resource id", node.resourceId);
//     return;
//   }

//   if (!sharedEmitter) {
//     console.error("no audio emitter found for local resource id", node.resourceId);
//     return;
//   }

//   // set position using worldMatrix from AudioSharedNode
//   mat4.getTranslation(tempPosition, sharedAudio.worldMatrix);
//   pannerNode.positionX.setValueAtTime(tempPosition[0], currentTime);
//   pannerNode.positionY.setValueAtTime(tempPosition[1], currentTime);
//   pannerNode.positionZ.setValueAtTime(tempPosition[2], currentTime);

//   // set panner node properties from local positional emitter's shared data
//   pannerNode.coneInnerAngle = sharedEmitter.coneInnerAngle[0];
//   pannerNode.coneOuterAngle = sharedEmitter.coneOuterAngle[0];
//   pannerNode.coneOuterGain = sharedEmitter.coneOuterGain[0];
//   pannerNode.distanceModel = AudioEmitterDistanceModelMap[sharedEmitter.distanceModel[0]];
//   pannerNode.maxDistance = sharedEmitter.maxDistance[0];
//   pannerNode.refDistance = sharedEmitter.refDistance[0];
//   pannerNode.rolloffFactor = sharedEmitter.rolloffFactor[0];
// }

// function createPannerNode(ctx: IMainThreadContext, node: MainNode, audioEmitter: LocalPositionalAudioEmitter) {
//   const audioModule = getModule(ctx, AudioModule);

//   const pannerNode = audioModule.context.createPanner();
//   pannerNode.panningModel = "HRTF";
//   const gainNode = audioModule.context.createGain();
//   pannerNode.connect(gainNode);
//   gainNode.connect(audioModule.mainGain);

//   for (const source of audioEmitter.sources) {
//     source.gainNode.connect(pannerNode);
//   }

//   node.pannerNode = pannerNode;
//   node.gainNode = gainNode;
// }

// function updatePannerNode(ctx: IMainThreadContext, node: MainNode, audioEmitter: LocalPositionalAudioEmitter) {
//   const audioModule = getModule(ctx, AudioModule);

//   const nodeView = getReadObjectBufferView(node.mainNodeTrupleBuffer);
//   const audioEmitterView = getReadObjectBufferView(audioEmitter.sharedPositionalAudioEmitter);

//   const gainNode = node.gainNode!;
//   const pannerNode = node.pannerNode!;

//   gainNode.gain.value = audioEmitterView.gain[0];
//   pannerNode.coneInnerAngle = audioEmitterView.coneInnerAngle[0];
//   pannerNode.coneOuterAngle = audioEmitterView.coneOuterAngle[0];
//   pannerNode.coneOuterGain = audioEmitterView.coneOuterGain[0];
//   pannerNode.distanceModel = AudioEmitterDistanceModelMap[audioEmitterView.distanceModel[0]];
//   pannerNode.maxDistance = audioEmitterView.maxDistance[0];
//   pannerNode.refDistance = audioEmitterView.refDistance[0];
//   pannerNode.rolloffFactor = audioEmitterView.rolloffFactor[0];

//   const currentTime = audioModule.context.currentTime;

//   // set position using worldMatrix from AudioSharedNode
//   mat4.getTranslation(tempPosition, nodeView.worldMatrix);
//   pannerNode.positionX.setValueAtTime(tempPosition[0], currentTime);
//   pannerNode.positionY.setValueAtTime(tempPosition[1], currentTime);
//   pannerNode.positionZ.setValueAtTime(tempPosition[2], currentTime);
// }

/*********
 * Utils *
 ********/

const isChrome = /Chrome/.test(navigator.userAgent);

export const setPeerMediaStream = (audioState: MainAudioModule, peerId: string, mediaStream: MediaStream) => {
  // https://bugs.chromium.org/p/chromium/issues/detail?id=933677
  if (isChrome) {
    const audioEl = new Audio();
    audioEl.srcObject = mediaStream;
    audioEl.setAttribute("autoplay", "autoplay");
    audioEl.muted = true;
  }
  audioState.mediaStreams.set(peerId, mediaStream);
};

export enum AudioDataType {
  Buffer,
  Element,
}

interface BaseLocalAudioData<Data> {
  resourceId: ResourceId;
  type: AudioDataType;
  data: Data;
}

interface LocalAudioBufferData extends BaseLocalAudioData<AudioBuffer> {
  resourceId: ResourceId;
  type: AudioDataType.Buffer;
}

interface LocalAudioElementData extends BaseLocalAudioData<HTMLAudioElement> {
  resourceId: ResourceId;
  type: AudioDataType.Element;
}

type LocalAudioData = LocalAudioBufferData | LocalAudioElementData;

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
