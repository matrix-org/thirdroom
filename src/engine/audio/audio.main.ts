import { vec3, mat4 } from "gl-matrix";
import EventEmitter from "events";

import { IMainThreadContext } from "../MainThread";
import { defineModule, getModule, Thread } from "../module/module.common";
import { AudioMessageType, AudioStateTripleBuffer, InitializeAudioStateMessage } from "./audio.common";
import { getLocalResource, getResourceDisposed, getLocalResources } from "../resource/resource.main";
import { ResourceId } from "../resource/resource.common";
import { AudioNodeTripleBuffer } from "../node/node.common";
import { MainNode } from "../node/node.main";
import { getReadObjectBufferView, ReadObjectTripleBufferView } from "../allocator/ObjectBufferView";
import { MainScene } from "../scene/scene.main";
import { NOOP } from "../config.common";
import { MainThreadNametagResource, updateNametag } from "../nametag/nametag.main";
import {
  AudioDataResource,
  AudioEmitterDistanceModel,
  AudioEmitterOutput,
  AudioEmitterResource,
  AudioEmitterType,
  AudioSourceResource,
  SceneResource,
} from "../resource/schema";
import { toArrayBuffer } from "../utils/arraybuffer";
import { defineLocalResourceClass } from "../resource/LocalResourceClass";

const MAX_AUDIO_BYTES = 640_000;

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
  nodes: MainNode[];
  scenes: MainScene[];
  activeScene?: MainThreadSceneResource;
  nametags: MainThreadNametagResource[];
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
      nodes: [],
      scenes: [],
      nametags: [],
      eventEmitter: new EventEmitter(),
    };
  },
  init(ctx) {
    const audio = getModule(ctx, AudioModule);

    return () => {
      audio.context.close();
    };
  },
});

/********************
 * Resource Handlers *
 *******************/

export class MainThreadAudioDataResource extends defineLocalResourceClass<typeof AudioDataResource, IMainThreadContext>(
  AudioDataResource
) {
  data: AudioBuffer | HTMLAudioElement | MediaStream | undefined;

  async load(ctx: IMainThreadContext) {
    const audio = getModule(ctx, AudioModule);

    let buffer: ArrayBuffer;
    let mimeType: string;

    if (this.bufferView) {
      buffer = toArrayBuffer(this.bufferView.buffer.data, this.bufferView.byteOffset, this.bufferView.byteLength);
      mimeType = this.mimeType;
    } else {
      const url = new URL(this.uri, window.location.href);

      if (url.protocol === "mediastream:") {
        this.data = audio.mediaStreams.get(url.pathname);
        return;
      }

      const response = await fetch(url.href);

      const contentType = response.headers.get("Content-Type");

      if (contentType) {
        mimeType = contentType;
      } else {
        mimeType = getAudioMimeType(this.uri);
      }

      buffer = await response.arrayBuffer();
    }

    if (buffer.byteLength > MAX_AUDIO_BYTES) {
      const objectUrl = URL.createObjectURL(new Blob([buffer], { type: mimeType }));

      const audioEl = new Audio();

      await new Promise((resolve, reject) => {
        audioEl.oncanplaythrough = resolve;
        audioEl.onerror = reject;
        audioEl.src = objectUrl;
      });

      this.data = audioEl;
    } else {
      this.data = await audio.context.decodeAudioData(buffer);
    }
  }
}

export class MainThreadAudioSourceResource extends defineLocalResourceClass<
  typeof AudioSourceResource,
  IMainThreadContext
>(AudioSourceResource) {
  declare audio: MainThreadAudioDataResource | undefined;
  activeAudioDataResourceId: ResourceId = 0;
  sourceNode: MediaElementAudioSourceNode | AudioBufferSourceNode | MediaStreamAudioSourceNode | undefined;
  gainNode: GainNode | undefined;

  async load(ctx: IMainThreadContext) {
    const audioModule = getModule(ctx, AudioModule);
    const audioContext = audioModule.context;
    this.gainNode = audioContext.createGain();
  }

  dispose() {
    if (this.gainNode) {
      this.gainNode.disconnect();
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
    }
  }
}

export class MainThreadAudioEmitterResource extends defineLocalResourceClass<
  typeof AudioEmitterResource,
  IMainThreadContext
>(AudioEmitterResource) {
  declare sources: MainThreadAudioSourceResource[];
  activeSources: MainThreadAudioSourceResource[] = [];
  inputGain: GainNode | undefined;
  outputGain: GainNode | undefined;

  async load(ctx: IMainThreadContext) {
    const audioModule = getModule(ctx, AudioModule);
    const audioContext = audioModule.context;

    this.inputGain = audioContext.createGain();
    // input gain connected by node update

    this.outputGain = audioContext.createGain();
    const destination =
      this.output === AudioEmitterOutput.Voice
        ? audioModule.voiceGain
        : this.output === AudioEmitterOutput.Music
        ? audioModule.musicGain
        : audioModule.environmentGain;
    this.outputGain.connect(destination);
  }

  dispose() {
    if (this.inputGain) {
      this.inputGain.disconnect();
    }

    if (this.outputGain) {
      this.outputGain.disconnect();
    }
  }
}

export class MainThreadSceneResource extends defineLocalResourceClass<typeof SceneResource, IMainThreadContext>(
  SceneResource
) {
  declare audioEmitters: MainThreadAudioEmitterResource[];
  activeEmitters: MainThreadAudioEmitterResource[] = [];
}

/***********
 * Systems *
 **********/

export function MainThreadAudioSystem(ctx: IMainThreadContext) {
  const audioModule = getModule(ctx, AudioModule);

  const audioStateView = getReadObjectBufferView(audioModule.audioStateTripleBuffer);

  const activeAudioListener = audioStateView.activeAudioListenerResourceId[0];
  const activeSceneResourceId = audioStateView.activeSceneResourceId[0];

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

const MAX_AUDIO_COUNT = 1000;
let audioCount = 0;

function updateAudioSources(ctx: IMainThreadContext, audioModule: MainAudioModule) {
  const localAudioSources = getLocalResources(ctx, MainThreadAudioSourceResource);

  for (let i = 0; i < localAudioSources.length; i++) {
    const localAudioSource = localAudioSources[i];

    const currentAudioDataResourceId = localAudioSource.activeAudioDataResourceId;
    const nextAudioDataResourceId = localAudioSource.audio?.resourceId || 0;

    // Dispose old sourceNode when changing audio data
    if (currentAudioDataResourceId !== nextAudioDataResourceId && localAudioSource.sourceNode) {
      localAudioSource.sourceNode.disconnect();
      localAudioSource.sourceNode = undefined;
    }

    if (!localAudioSource.audio) {
      continue;
    }

    const audioData = localAudioSource.audio.data;

    if (audioData instanceof MediaStream) {
      // Create a new MediaElementSourceNode
      if (!localAudioSource.sourceNode) {
        localAudioSource.sourceNode = audioModule.context.createMediaStreamSource(audioData);
        localAudioSource.sourceNode.connect(localAudioSource.gainNode!);
      }
    } else if (audioData instanceof AudioBuffer) {
      // One-shot audio buffer source
      if (localAudioSource.play && !localAudioSource.loop && audioCount < MAX_AUDIO_COUNT) {
        const sampleSource = audioModule.context.createBufferSource();
        sampleSource.connect(localAudioSource.gainNode!);
        sampleSource.buffer = audioData;
        sampleSource.playbackRate.value = localAudioSource.playbackRate;

        sampleSource.onended = () => {
          sampleSource.disconnect();
          audioCount--;
        };

        sampleSource.start();
        audioCount++;

        // playing and looping
      } else if (localAudioSource.play && localAudioSource.loop) {
        if (localAudioSource.sourceNode) {
          (localAudioSource.sourceNode as AudioBufferSourceNode).stop();
        }

        const sampleSource = audioModule.context.createBufferSource();
        sampleSource.connect(localAudioSource.gainNode!);
        sampleSource.buffer = audioData;

        localAudioSource.sourceNode = sampleSource;
        sampleSource.playbackRate.value = localAudioSource.playbackRate;
        sampleSource.loop = true;
        sampleSource.start();
      }

      // Stop
      if (!localAudioSource.playing && localAudioSource.sourceNode) {
        (localAudioSource.sourceNode as AudioBufferSourceNode).stop();
      }

      // Stop looping
      if (!localAudioSource.loop && localAudioSource.sourceNode) {
        (localAudioSource.sourceNode as AudioBufferSourceNode).loop = false;
      }
    } else if (audioData instanceof HTMLAudioElement) {
      // Create a new MediaElementSourceNode
      if (!localAudioSource.sourceNode) {
        const el = audioData.cloneNode() as HTMLMediaElement;
        localAudioSource.sourceNode = audioModule.context.createMediaElementSource(el);
        localAudioSource.sourceNode.connect(localAudioSource.gainNode!);
      }

      const mediaSourceNode = localAudioSource.sourceNode as MediaElementAudioSourceNode;
      const mediaEl = mediaSourceNode.mediaElement;

      if (localAudioSource.play) {
        mediaEl.playbackRate = localAudioSource.playbackRate;
        mediaEl.loop = !!localAudioSource.loop;
        mediaEl.currentTime = localAudioSource.seek < 0 ? 0 : localAudioSource.seek;
        mediaEl.play();
      }

      if (!localAudioSource.playing && !mediaEl.paused) {
        mediaEl.pause();
      }

      // Seek will be -1 when not seeking this frame
      if (localAudioSource.seek >= 0) {
        mediaEl.currentTime = localAudioSource.seek;
      }
    }

    localAudioSource.gainNode!.gain.value = localAudioSource.gain;
  }
}

function updateAudioEmitters(ctx: IMainThreadContext, audioModule: MainAudioModule) {
  const localAudioEmitters = getLocalResources(ctx, MainThreadAudioEmitterResource);

  for (let i = 0; i < localAudioEmitters.length; i++) {
    const audioEmitter = localAudioEmitters[i];

    const activeSources = audioEmitter.activeSources;
    const nextSources = audioEmitter.sources;

    // TODO: clean up disposed active sources?

    // synchronize disconnections
    for (let j = activeSources.length - 1; j >= 0; j--) {
      const activeSource = activeSources[j];

      if (!nextSources.some((source) => activeSource.resourceId === source.resourceId)) {
        activeSource.gainNode!.disconnect(audioEmitter.inputGain!);
        activeSources.splice(j, 1);
      }
    }

    // synchronize connections
    for (let j = 0; j < nextSources.length; j++) {
      const nextSource = nextSources[j];

      const source = activeSources.find((s) => s.resourceId === nextSource.resourceId);

      if (!source) {
        activeSources.push(nextSource);
        nextSource.gainNode!.connect(audioEmitter.inputGain!);
      }
    }

    audioEmitter.outputGain!.gain.value = audioEmitter.gain;
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

const AudioEmitterDistanceModelMap: { [key: number]: DistanceModelType } = {
  [AudioEmitterDistanceModel.Linear]: "linear",
  [AudioEmitterDistanceModel.Inverse]: "inverse",
  [AudioEmitterDistanceModel.Exponential]: "exponential",
};

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
      node.audioEmitter.inputGain!.disconnect(node.emitterPannerNode);
    }

    node.audioEmitter = undefined;

    // if emitter was removed
    if (nextAudioEmitterResourceId === NOOP && node.emitterPannerNode) {
      node.emitterPannerNode.disconnect();
      node.emitterPannerNode = undefined;

      // if emitter was created
    } else if (nextAudioEmitterResourceId !== NOOP && !node.emitterPannerNode) {
      node.audioEmitter = getLocalResource<MainThreadAudioEmitterResource>(ctx, nextAudioEmitterResourceId)?.resource;
      node.emitterPannerNode = audioModule.context.createPanner();
      node.emitterPannerNode.panningModel = "HRTF";
      // connect node's panner to emitter's gain
      if (node.audioEmitter) {
        node.audioEmitter.inputGain!.connect(node.emitterPannerNode);
        node.emitterPannerNode.connect(node.audioEmitter.outputGain!);
      }
    }
  }

  if (!node.audioEmitter || !node.emitterPannerNode) {
    return;
  }

  const pannerNode = node.emitterPannerNode;
  const audioEmitter = node.audioEmitter;

  // update emitter

  const output: AudioEmitterOutput = audioEmitter.output;

  // Output changed
  if (output !== node.emitterOutput) {
    audioEmitter.outputGain!.disconnect();

    if (output === AudioEmitterOutput.Voice) {
      audioEmitter.outputGain!.connect(audioModule.voiceGain);
    } else if (output === AudioEmitterOutput.Music) {
      audioEmitter.outputGain!.connect(audioModule.musicGain);
    } else {
      audioEmitter.outputGain!.connect(audioModule.environmentGain);
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
  pannerNode.coneInnerAngle = audioEmitter.coneInnerAngle;
  pannerNode.coneOuterAngle = audioEmitter.coneOuterAngle;
  pannerNode.coneOuterGain = audioEmitter.coneOuterGain;
  pannerNode.distanceModel = AudioEmitterDistanceModelMap[audioEmitter.distanceModel];
  pannerNode.maxDistance = audioEmitter.maxDistance;
  pannerNode.refDistance = audioEmitter.refDistance;
  pannerNode.rolloffFactor = audioEmitter.rolloffFactor;
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
        emitter.outputGain!.disconnect();
      }

      audioModule.activeScene.activeEmitters.length = 0;
    }

    // if scene was added
    if (nextSceneResourceId !== NOOP) {
      // Set new scene if it's loaded
      audioModule.activeScene = getLocalResource<MainThreadSceneResource>(ctx, nextSceneResourceId)?.resource;
    } else {
      // unset active scene
      audioModule.activeScene = undefined;
    }
  }

  // return if scene hasn't loaded or isn't active
  if (!audioModule.activeScene) {
    return;
  }

  for (const audioEmitter of audioModule.activeScene.audioEmitters) {
    if (audioEmitter.type !== AudioEmitterType.Global) {
      continue;
    }

    // if emitter resource exists but has not been added to the scene
    if (!audioModule.activeScene.activeEmitters.includes(audioEmitter)) {
      const output: AudioEmitterOutput = audioEmitter.output;

      audioEmitter.inputGain!.connect(audioEmitter.outputGain!);

      // connect emitter to appropriate output
      if (output === AudioEmitterOutput.Voice) {
        audioEmitter.outputGain!.connect(audioModule.voiceGain);
      } else if (output === AudioEmitterOutput.Music) {
        audioEmitter.outputGain!.connect(audioModule.musicGain);
      } else {
        audioEmitter.outputGain!.connect(audioModule.environmentGain);
      }
      // add emitter to scene
      audioModule.activeScene.activeEmitters.push(audioEmitter);
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
