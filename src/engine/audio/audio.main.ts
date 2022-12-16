import { vec3, mat4 } from "gl-matrix";
import EventEmitter from "events";

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
  SharedAudioEmitterResource,
  AudioEmitterDistanceModelMap,
} from "./audio.common";
import {
  getLocalResource,
  getResourceDisposed,
  registerResourceLoader,
  waitForLocalResource,
} from "../resource/resource.main";
import { ResourceId } from "../resource/resource.common";
import { AudioNodeTripleBuffer, NodeResourceType } from "../node/node.common";
import { MainNode, onLoadMainNode } from "../node/node.main";
import {
  getReadObjectBufferView,
  getWriteObjectBufferView,
  ReadObjectTripleBufferView,
} from "../allocator/ObjectBufferView";
import { MainScene, onLoadMainSceneResource } from "../scene/scene.main";
import { SceneResourceType } from "../scene/scene.common";
import { NOOP } from "../config.common";
import { LocalNametag, onLoadMainNametag, updateNametag } from "../nametag/nametag.main";
import { NametagResourceType } from "../nametag/nametag.common";
import { AudioEmitterOutput, AudioEmitterType, LocalBufferView } from "../resource/schema";
import { toArrayBuffer } from "../utils/arraybuffer";

/*********
 * Types *
 ********/

export interface MainAudioModule {
  audioStateTripleBuffer: AudioStateTripleBuffer;
  context: AudioContext;
  // todo: MixerTrack/MixerInsert interface
  mainLimiter: DynamicsCompressorNode;
  mainGain: GainNode;
  environmentGain: GainNode;
  voiceGain: GainNode;
  musicGain: GainNode;
  mediaStreams: Map<string, MediaStream>;
  sources: LocalAudioSource[];
  mediaStreamSources: LocalMediaStreamSource[];
  emitters: LocalAudioEmitter[];
  nodes: MainNode[];
  scenes: MainScene[];
  activeScene?: MainScene;
  nametags: LocalNametag[];
  eventEmitter: EventEmitter;
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
    const audioContext = new AudioContext();

    const mainLimiter = new DynamicsCompressorNode(audioContext);
    mainLimiter.threshold.value = -0.01;
    mainLimiter.knee.value = 0;
    mainLimiter.ratio.value = 20;
    mainLimiter.attack.value = 0.007;
    mainLimiter.release.value = 0.02;
    mainLimiter.connect(audioContext.destination);

    const mainGain = new GainNode(audioContext);
    mainGain.connect(mainLimiter);

    const environmentGain = new GainNode(audioContext);
    environmentGain.connect(mainGain);

    const voiceGain = new GainNode(audioContext);
    voiceGain.connect(mainGain);

    const musicGain = new GainNode(audioContext);
    musicGain.connect(mainGain);

    const { audioStateTripleBuffer } = await waitForMessage<InitializeAudioStateMessage>(
      Thread.Game,
      AudioMessageType.InitializeAudioState
    );

    return {
      audioStateTripleBuffer,
      context: audioContext,
      mainLimiter,
      mainGain,
      environmentGain,
      voiceGain,
      musicGain,
      mediaStreams: new Map(),
      sources: [],
      mediaStreamSources: [],
      emitters: [],
      nodes: [],
      scenes: [],
      nametags: [],
      eventEmitter: new EventEmitter(),
    };
  },
  init(ctx) {
    const audio = getModule(ctx, AudioModule);

    const disposables = [
      registerResourceLoader(ctx, NodeResourceType, onLoadMainNode),
      registerResourceLoader(ctx, SceneResourceType, onLoadMainSceneResource),
      registerResourceLoader(ctx, AudioResourceType.AudioData, onLoadAudioData),
      registerResourceLoader(ctx, AudioResourceType.AudioSource, onLoadAudioSource),
      registerResourceLoader(ctx, AudioResourceType.MediaStreamId, onLoadMediaStreamId),
      registerResourceLoader(ctx, AudioResourceType.MediaStreamSource, onLoadMediaStreamSource),
      registerResourceLoader(ctx, AudioResourceType.AudioEmitter, onLoadAudioEmitter),
      registerResourceLoader(ctx, NametagResourceType, onLoadMainNametag),
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
    buffer = toArrayBuffer(bufferView.buffer.data, bufferView.byteOffset, bufferView.byteLength);
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

async function onLoadMediaStreamId(
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
  autoPlay: boolean;
}

export const onLoadAudioSource = async (
  ctx: IMainThreadContext,
  resourceId: ResourceId,
  { readAudioSourceTripleBuffer, writeAudioSourceTripleBuffer }: SharedAudioSourceResource
): Promise<LocalAudioSource> => {
  const audio = getModule(ctx, AudioModule);

  const audioSourceView = getReadObjectBufferView(writeAudioSourceTripleBuffer);

  const autoPlay = !!audioSourceView.play[0];

  const data = audioSourceView.audio[0]
    ? await waitForLocalResource<LocalAudioData>(ctx, audioSourceView.audio[0])
    : undefined;

  const gainNode = audio.context.createGain();

  const localAudioSource: LocalAudioSource = {
    resourceId,
    data,
    gainNode,
    autoPlay,
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
  nodeResource?: MainNode;
  sources: LocalEmitterSource[];
  inputGain: GainNode;
  outputGain: GainNode;
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

  const sources: LocalEmitterSource[] = [];

  const output = sharedGlobalAudioEmitterView.output[0];
  const destination =
    output === AudioEmitterOutput.Voice
      ? audioModule.voiceGain
      : output === AudioEmitterOutput.Music
      ? audioModule.musicGain
      : audioModule.environmentGain;

  const inputGain = audioModule.context.createGain();
  // input gain connected by node update

  const outputGain = audioModule.context.createGain();
  outputGain.connect(destination);

  const emitter: BaseAudioEmitter<any> = {
    type,
    resourceId,
    sources,
    inputGain,
    outputGain,
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

  const activeAudioListener = audioStateView.activeAudioListenerResourceId[0];
  const activeSceneResourceId = audioStateView.activeSceneResourceId[0];

  updateMediaStreamSources(ctx, audioModule);
  updateAudioSources(ctx, audioModule);
  updateAudioEmitters(ctx, audioModule);
  updateGlobalAudioEmitters(ctx, audioModule, activeSceneResourceId);
  updateNodeAudioEmitters(ctx, audioModule, activeAudioListener);
}

function updateNodeAudioEmitters(ctx: IMainThreadContext, audioModule: MainAudioModule, activeAudioListener: number) {
  const { nodes } = audioModule;

  for (let i = nodes.length - 1; i >= 0; i--) {
    const node = nodes[i];

    if (getResourceDisposed(ctx, node.resourceId)) {
      if (node.audioEmitter) {
        node.emitterPannerNode?.disconnect();
      }
      if (node.nametag) {
        audioModule.nametags.splice(audioModule.nametags.indexOf(node.nametag), 1);
        audioModule.eventEmitter.emit("nametags-changed", audioModule.nametags);
      }

      nodes.splice(i, 1);
    }
  }

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const nodeView = getReadObjectBufferView(node.audioNodeTripleBuffer);

    updateNodeAudioEmitter(ctx, audioModule, node, nodeView);
    updateNametag(ctx, audioModule, node, nodeView);

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
      if (destination) {
        node.disconnect(destination as any, output as any, input as any);
      } else {
        node.disconnect();
      }
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

  for (let i = localMediaStreamSources.length - 1; i >= 0; i--) {
    const localMediaStreamSource = localMediaStreamSources[i];

    if (getResourceDisposed(ctx, localMediaStreamSource.resourceId)) {
      localMediaStreamSource.gainNode.disconnect();
      localMediaStreamSource.mediaStreamSourceNode.disconnect();
      localMediaStreamSources.splice(i, 1);
    }
  }

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

const MAX_AUDIO_COUNT = 1000;
let audioCount = 0;

function updateAudioSources(ctx: IMainThreadContext, audioModule: MainAudioModule) {
  const localAudioSources = audioModule.sources;

  for (let i = localAudioSources.length - 1; i >= 0; i--) {
    const localAudioSource = localAudioSources[i];

    if (getResourceDisposed(ctx, localAudioSource.resourceId)) {
      localAudioSource.gainNode.disconnect();

      if (localAudioSource.sourceNode) {
        localAudioSource.sourceNode.disconnect();
      }

      localAudioSources.splice(i, 1);
    }
  }

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

    const nextAudioData = getLocalResource<LocalAudioData>(ctx, nextAudioDataResourceId)?.resource;

    if (nextAudioData) {
      localAudioSource.data = nextAudioData;
    }

    if (!localAudioSource.data) {
      continue;
    }

    const currentAudioData = localAudioSource.data?.data;

    if (currentAudioData instanceof AudioBuffer) {
      const audioBuffer = currentAudioData as AudioBuffer;
      if (audioBuffer) {
        // One-shot audio buffer source
        if (
          (readSourceView.play[0] || localAudioSource.autoPlay) &&
          !readSourceView.loop[0] &&
          audioCount < MAX_AUDIO_COUNT
        ) {
          const sampleSource = audioModule.context.createBufferSource();
          sampleSource.connect(localAudioSource.gainNode);
          sampleSource.buffer = audioBuffer;
          sampleSource.playbackRate.value = readSourceView.playbackRate[0];

          sampleSource.onended = () => {
            sampleSource.disconnect();
            audioCount--;
          };

          sampleSource.start();
          audioCount++;

          // For one-shots don't update the current time or playing state.
          writeSourceView.playing[0] = 0;
          writeSourceView.currentTime[0] = 0;
          localAudioSource.autoPlay = false;

          // playing and looping
        } else if ((readSourceView.play[0] || localAudioSource.autoPlay) && readSourceView.loop[0]) {
          writeSourceView.playing[0] = 1;
          localAudioSource.autoPlay = false;

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
  const localAudioEmitters = audioModule.emitters;

  for (let i = localAudioEmitters.length - 1; i >= 0; i--) {
    const localAudioEmitter = localAudioEmitters[i];

    if (getResourceDisposed(ctx, localAudioEmitter.resourceId)) {
      localAudioEmitter.inputGain.disconnect();
      localAudioEmitter.outputGain.disconnect();
      localAudioEmitters.splice(i, 1);
    }
  }

  for (let i = 0; i < localAudioEmitters.length; i++) {
    const audioEmitter = localAudioEmitters[i];
    const emitterView = getReadObjectBufferView(audioEmitter.emitterTripleBuffer);

    const currentSources = audioEmitter.sources;
    const nextSourceIDs = emitterView.sources;

    // synchronize disconnections
    for (let j = currentSources.length - 1; j >= 0; j--) {
      const currentSource = currentSources[j];

      if (!nextSourceIDs.includes(currentSource.resourceId)) {
        currentSource.gainNode.disconnect(audioEmitter.inputGain);
        currentSources.splice(j, 1);
      }
    }

    // synchronize connections
    for (let j = 0; j < nextSourceIDs.length; j++) {
      const nextSourceRid = nextSourceIDs[j];

      if (nextSourceRid === NOOP) continue;

      let source = currentSources.find((s) => s.resourceId === nextSourceRid);

      if (!source) {
        source = getLocalResource<LocalEmitterSource>(ctx, nextSourceRid)?.resource;

        if (source) {
          currentSources.push(source);
          source.gainNode.connect(audioEmitter.inputGain);
        }
      }
    }

    audioEmitter.outputGain.gain.value = emitterView.gain[0];
  }
}

const tempPosition = vec3.create();

function setAudioListenerTransform(listener: AudioListener, worldMatrix: Float32Array) {
  mat4.getTranslation(tempPosition, worldMatrix);

  if (isNaN(tempPosition[0])) {
    return;
  }

  if (listener.upX) {
    // upX/Y/Z not supported in Firefox
    listener.upX.value = 0;
    listener.upY.value = 1;
    listener.upZ.value = 0;
  }

  if (listener.positionX) {
    listener.positionX.value = tempPosition[0];
    listener.positionY.value = tempPosition[1];
    listener.positionZ.value = tempPosition[2];
  } else {
    // positionX/Y/Z not supported in Firefox
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
    // forwardX/Y/Z not supported in Firefox
    listener.setOrientation(tempPosition[0], tempPosition[1], tempPosition[2], 0, 1, 0);
  }
}

export function updateNodeAudioEmitter(
  ctx: IMainThreadContext,
  audioModule: MainAudioModule,
  node: MainNode,
  nodeView: ReadObjectTripleBufferView<AudioNodeTripleBuffer>
) {
  const currentAudioEmitterResourceId = node.audioEmitter?.resourceId || 0;
  const nextAudioEmitterResourceId = nodeView.audioEmitter[0];

  // If emitter changed
  if (currentAudioEmitterResourceId !== nextAudioEmitterResourceId) {
    if (node.audioEmitter && node.emitterPannerNode) {
      node.audioEmitter.inputGain.disconnect(node.emitterPannerNode);
    }

    node.audioEmitter = undefined;

    // if emitter was removed
    if (nextAudioEmitterResourceId === NOOP && node.emitterPannerNode) {
      node.emitterPannerNode.disconnect();
      node.emitterPannerNode = undefined;

      // if emitter was created
    } else if (nextAudioEmitterResourceId !== NOOP && !node.emitterPannerNode) {
      node.audioEmitter = getLocalResource<LocalPositionalAudioEmitter>(ctx, nextAudioEmitterResourceId)?.resource;
      node.emitterPannerNode = audioModule.context.createPanner();
      node.emitterPannerNode.panningModel = "HRTF";
      // connect node's panner to emitter's gain
      if (node.audioEmitter) {
        node.audioEmitter.nodeResource = node;
        node.audioEmitter.inputGain.connect(node.emitterPannerNode);
        node.emitterPannerNode.connect(node.audioEmitter.outputGain);
      }
    }
  }

  if (!node.audioEmitter || !node.emitterPannerNode) {
    return;
  }

  const pannerNode = node.emitterPannerNode;
  const audioEmitter = node.audioEmitter;

  // update emitter

  const audioEmitterView = getReadObjectBufferView(node.audioEmitter.emitterTripleBuffer);

  const output: AudioEmitterOutput = audioEmitterView.output[0];

  // Output changed
  if (output !== node.emitterOutput) {
    audioEmitter.outputGain.disconnect();

    if (output === AudioEmitterOutput.Voice) {
      audioEmitter.outputGain.connect(audioModule.voiceGain);
    } else if (output === AudioEmitterOutput.Music) {
      audioEmitter.outputGain.connect(audioModule.musicGain);
    } else {
      audioEmitter.outputGain.connect(audioModule.environmentGain);
    }

    node.emitterOutput = output;
  }

  const worldMatrix = nodeView.worldMatrix;
  const currentTime = audioModule.context.currentTime;

  mat4.getTranslation(tempPosition, nodeView.worldMatrix);

  if (isNaN(tempPosition[0])) return;

  pannerNode.positionX.setValueAtTime(tempPosition[0], currentTime);
  pannerNode.positionY.setValueAtTime(tempPosition[1], currentTime);
  pannerNode.positionZ.setValueAtTime(tempPosition[2], currentTime);

  tempPosition[0] = -worldMatrix[8];
  tempPosition[1] = -worldMatrix[9];
  tempPosition[2] = -worldMatrix[10];

  vec3.normalize(tempPosition, tempPosition);

  if (pannerNode.orientationX) {
    pannerNode.orientationX.value = tempPosition[0];
    pannerNode.orientationY.value = tempPosition[1];
    pannerNode.orientationZ.value = tempPosition[2];
  } else {
    pannerNode.setOrientation(tempPosition[0], tempPosition[1], tempPosition[2]);
  }

  // set panner node properties from local positional emitter's shared data
  pannerNode.coneInnerAngle = audioEmitterView.coneInnerAngle[0];
  pannerNode.coneOuterAngle = audioEmitterView.coneOuterAngle[0];
  pannerNode.coneOuterGain = audioEmitterView.coneOuterGain[0];
  pannerNode.distanceModel = AudioEmitterDistanceModelMap[audioEmitterView.distanceModel[0]];
  pannerNode.maxDistance = audioEmitterView.maxDistance[0];
  pannerNode.refDistance = audioEmitterView.refDistance[0];
  pannerNode.rolloffFactor = audioEmitterView.rolloffFactor[0];
}

function updateGlobalAudioEmitters(
  ctx: IMainThreadContext,
  audioModule: MainAudioModule,
  nextSceneResourceId: ResourceId
) {
  const currentSceneResourceId = audioModule.activeScene?.resourceId || 0;

  // if scene has changed
  if (nextSceneResourceId !== currentSceneResourceId) {
    // disconnect emitters
    if (audioModule.activeScene) {
      for (const emitter of audioModule.activeScene.audioEmitters) {
        emitter.outputGain.disconnect();
      }
    }

    // if scene was added
    if (nextSceneResourceId !== NOOP) {
      // Set new scene if it's loaded
      audioModule.activeScene = getLocalResource<MainScene>(ctx, nextSceneResourceId)?.resource;
    } else {
      // unset active scene
      audioModule.activeScene = undefined;
    }
  }

  // return if scene hasn't loaded or isn't active
  if (!audioModule.activeScene) {
    return;
  }

  // update scene with data from tb view
  const activeSceneView = getReadObjectBufferView(audioModule.activeScene.audioSceneTripleBuffer);

  for (const emitterRid of Array.from(activeSceneView.audioEmitters)) {
    if (emitterRid === NOOP) continue;

    const emitter = getLocalResource<LocalGlobalAudioEmitter>(ctx, emitterRid)?.resource;

    if (emitter?.type !== AudioEmitterType.Global) {
      continue;
    }

    // if emitter resource exists but has not been added to the scene
    if (emitter && !audioModule.activeScene.audioEmitters.includes(emitter)) {
      const audioEmitterView = getReadObjectBufferView(emitter?.emitterTripleBuffer);
      const output: AudioEmitterOutput = audioEmitterView.output[0];

      emitter.inputGain.connect(emitter.outputGain);

      // connect emitter to appropriate output
      if (output === AudioEmitterOutput.Voice) {
        emitter.outputGain.connect(audioModule.voiceGain);
      } else if (output === AudioEmitterOutput.Music) {
        emitter.outputGain.connect(audioModule.musicGain);
      } else {
        emitter.outputGain.connect(audioModule.environmentGain);
      }
      // add emitter to scene
      audioModule.activeScene.audioEmitters.push(emitter);
    }
  }
}

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
  console.log("adding mediastream for peer", peerId);
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
