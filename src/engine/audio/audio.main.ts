import { vec3, mat4 } from "gl-matrix";
import EventEmitter from "events";

import { IMainThreadContext } from "../MainThread";
import { defineModule, getModule } from "../module/module.common";
import {
  getLocalResources,
  MainAudioData,
  MainAudioEmitter,
  MainAudioSource,
  MainNode,
  MainScene,
} from "../resource/resource.main";
import { AudioEmitterDistanceModel, AudioEmitterOutput } from "../resource/schema";
import { toArrayBuffer } from "../utils/arraybuffer";
import { LoadStatus } from "../resource/resource.common";

/*********
 * Types *
 ********/

export interface MainAudioModule {
  context: AudioContext;
  // todo: MixerTrack/MixerInsert interface
  mainLimiter: DynamicsCompressorNode;
  mainGain: GainNode;
  environmentGain: GainNode;
  voiceGain: GainNode;
  musicGain: GainNode;
  mediaStreams: Map<string, MediaStream>;
  scenes: MainScene[];
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

    return {
      context: audioContext,
      mainLimiter,
      mainGain,
      environmentGain,
      voiceGain,
      musicGain,
      mediaStreams: new Map(),
      scenes: [],
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

/***********
 * Systems *
 **********/

export function MainThreadAudioSystem(ctx: IMainThreadContext) {
  const audioModule = getModule(ctx, AudioModule);
  updateAudioDatas(ctx, audioModule);
  updateAudioSources(ctx, audioModule);
  updateAudioEmitters(ctx, audioModule);
  updateNodeAudioEmitters(ctx, audioModule);
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

async function loadAudioData(
  audioModule: MainAudioModule,
  audioData: MainAudioData,
  signal: AbortSignal
): Promise<AudioBuffer | HTMLAudioElement | MediaStream | undefined> {
  let buffer: ArrayBuffer;
  let mimeType: string;

  if (audioData.bufferView) {
    buffer = toArrayBuffer(
      audioData.bufferView.buffer.data,
      audioData.bufferView.byteOffset,
      audioData.bufferView.byteLength
    );
    mimeType = audioData.mimeType;
  } else {
    const url = new URL(audioData.uri, window.location.href);

    if (url.protocol === "mediastream:") {
      return audioModule.mediaStreams.get(url.pathname);
    }

    const response = await fetch(url.href, { signal });

    const contentType = response.headers.get("Content-Type");

    if (contentType) {
      mimeType = contentType;
    } else {
      mimeType = getAudioMimeType(audioData.uri);
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

    return audioEl;
  } else {
    return audioModule.context.decodeAudioData(buffer);
  }
}

function updateNodeAudioEmitters(ctx: IMainThreadContext, audioModule: MainAudioModule) {
  const nodes = getLocalResources(ctx, MainNode);

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];

    updateNodeAudioEmitter(ctx, audioModule, node);

    if (node === ctx.worldResource!.activeCameraNode) {
      setAudioListenerTransform(audioModule.context.listener, node.worldMatrix);
    }
  }
}

function updateAudioDatas(ctx: IMainThreadContext, audioModule: MainAudioModule) {
  const audioDatas = getLocalResources(ctx, MainAudioData);

  for (let i = 0; i < audioDatas.length; i++) {
    const audioData = audioDatas[i];

    if (audioData.loadStatus === LoadStatus.Uninitialized) {
      const abortController = new AbortController();

      audioData.abortController = abortController;

      audioData.loadStatus = LoadStatus.Loading;

      loadAudioData(audioModule, audioData, abortController.signal)
        .then((data) => {
          if (audioData.loadStatus === LoadStatus.Loaded) {
            throw new Error("Attempted to load a resource that has already been loaded.");
          }

          if (audioData.loadStatus !== LoadStatus.Disposed) {
            audioData.data = data;
            audioData.loadStatus = LoadStatus.Loaded;
          }
        })
        .catch((error) => {
          if (error.name === "AbortError") {
            return;
          }

          audioData.loadStatus = LoadStatus.Error;
        });
    }
  }
}

const MAX_AUDIO_COUNT = 1000;
let audioCount = 0;

function updateAudioSources(ctx: IMainThreadContext, audioModule: MainAudioModule) {
  const localAudioSources = getLocalResources(ctx, MainAudioSource);

  for (let i = 0; i < localAudioSources.length; i++) {
    const localAudioSource = localAudioSources[i];

    const currentAudioDataResourceId = localAudioSource.activeAudioDataResourceId;
    const nextAudioDataResourceId = localAudioSource.audio?.eid || 0;

    // Dispose old sourceNode when changing audio data
    if (currentAudioDataResourceId !== nextAudioDataResourceId && localAudioSource.sourceNode) {
      localAudioSource.sourceNode.disconnect();
      localAudioSource.sourceNode = undefined;
    }

    if (!localAudioSource.audio) {
      continue;
    }

    const audioData = localAudioSource.audio.data;

    // Handle first load of audio data here?

    localAudioSource.activeAudioDataResourceId = nextAudioDataResourceId;

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
      } else if (localAudioSource.play && localAudioSource.loop && !localAudioSource.sourceNode) {
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
        localAudioSource.sourceNode = undefined;
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
  const localAudioEmitters = getLocalResources(ctx, MainAudioEmitter);

  for (let i = 0; i < localAudioEmitters.length; i++) {
    const audioEmitter = localAudioEmitters[i];

    const activeSources = audioEmitter.activeSources;
    const nextSources = audioEmitter.sources;

    // TODO: clean up disposed active sources?

    // synchronize disconnections
    for (let j = activeSources.length - 1; j >= 0; j--) {
      const activeSource = activeSources[j];

      if (!nextSources.some((source) => activeSource.eid === source.eid)) {
        try {
          activeSource.gainNode!.disconnect(audioEmitter.inputGain!);
        } catch {}
        activeSources.splice(j, 1);
      }
    }

    // synchronize connections
    for (let j = 0; j < nextSources.length; j++) {
      const nextSource = nextSources[j];

      const source = activeSources.find((s) => s.eid === nextSource.eid);

      if (!source) {
        activeSources.push(nextSource);
        nextSource.gainNode!.connect(audioEmitter.inputGain!);
      }
    }

    audioEmitter.outputGain!.gain.value = audioEmitter.gain;

    const nextDestination =
      audioEmitter.output === AudioEmitterOutput.Voice
        ? audioModule.voiceGain
        : audioEmitter.output === AudioEmitterOutput.Music
        ? audioModule.musicGain
        : audioModule.environmentGain;

    // Output changed
    if (audioEmitter.destination !== nextDestination) {
      audioEmitter.outputGain!.disconnect();
      audioEmitter.outputGain!.connect(nextDestination);
      audioEmitter.destination = nextDestination;
    }
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

const RAD2DEG = 180 / Math.PI;

export function updateNodeAudioEmitter(ctx: IMainThreadContext, audioModule: MainAudioModule, node: MainNode) {
  const currentAudioEmitterResourceId = node.currentAudioEmitterResourceId;
  const nextAudioEmitterResourceId = node.audioEmitter?.eid || 0;

  // If emitter changed
  if (currentAudioEmitterResourceId !== nextAudioEmitterResourceId && node.emitterInputNode && node.emitterPannerNode) {
    try {
      node.emitterInputNode.disconnect(node.emitterPannerNode);
    } catch {}
    node.emitterPannerNode.disconnect();
    node.emitterInputNode = undefined;
    node.emitterPannerNode = undefined;
  }

  node.currentAudioEmitterResourceId = nextAudioEmitterResourceId;

  if (!node.audioEmitter) {
    return;
  }

  if (!node.emitterPannerNode) {
    node.emitterPannerNode = audioModule.context.createPanner();
    node.emitterPannerNode.panningModel = "HRTF";
    // connect node's panner to emitter's gain
    node.audioEmitter.inputGain!.connect(node.emitterPannerNode);
    node.emitterPannerNode.connect(node.audioEmitter.outputGain!);
    node.emitterInputNode = node.audioEmitter.inputGain;
  }

  const pannerNode = node.emitterPannerNode;
  const audioEmitter = node.audioEmitter;

  const worldMatrix = node.worldMatrix;
  const currentTime = audioModule.context.currentTime;

  mat4.getTranslation(tempPosition, node.worldMatrix);

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
  pannerNode.coneInnerAngle = audioEmitter.coneInnerAngle * RAD2DEG;
  pannerNode.coneOuterAngle = audioEmitter.coneOuterAngle * RAD2DEG;
  pannerNode.coneOuterGain = audioEmitter.coneOuterGain;
  pannerNode.distanceModel = AudioEmitterDistanceModelMap[audioEmitter.distanceModel];
  pannerNode.maxDistance = audioEmitter.maxDistance;
  pannerNode.refDistance = audioEmitter.refDistance;
  pannerNode.rolloffFactor = audioEmitter.rolloffFactor;
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
