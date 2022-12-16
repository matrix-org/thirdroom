import {
  RemoteAudioEmitter,
  createRemoteGlobalAudioEmitter,
  createRemotePositionalAudioEmitter,
  createRemoteAudioData,
  createRemoteAudioFromBufferView,
  createRemoteAudioSource,
  RemoteAudioData,
  RemoteAudioSource,
  RemoteGlobalAudioEmitter,
} from "../audio/audio.game";
import { GameState } from "../GameTypes";
import { AudioEmitterOutput } from "../resource/schema";
import resolveURL from "../utils/resolveURL";
import { GLTFNode, GLTFScene } from "./GLTF";
import { GLTFResource, loadGLTFBufferView } from "./gltf.game";

export function loadSceneAudioEmitters(
  ctx: GameState,
  resource: GLTFResource,
  scene: GLTFScene
): Promise<RemoteGlobalAudioEmitter[]> | undefined {
  const emitters = scene.extensions?.KHR_audio?.emitters as number[] | undefined;

  if (!emitters) {
    return undefined;
  }

  return Promise.all(
    emitters.map((emitterIndex) => loadGLTFAudioEmitter<RemoteGlobalAudioEmitter>(ctx, resource, emitterIndex))
  );
}

export function loadNodeAudioEmitter(
  ctx: GameState,
  resource: GLTFResource,
  node: GLTFNode
): Promise<RemoteAudioEmitter> | undefined {
  const emitter = node.extensions?.KHR_audio?.emitter;

  if (emitter === undefined) {
    return undefined;
  }

  return loadGLTFAudioEmitter<RemoteAudioEmitter>(ctx, resource, emitter);
}

export async function loadGLTFAudio(ctx: GameState, resource: GLTFResource, index: number): Promise<RemoteAudioData> {
  let audioPromise = resource.audioPromises.get(index);

  if (audioPromise) {
    return audioPromise;
  }

  audioPromise = _loadGLTFAudio(ctx, resource, index);

  resource.audioPromises.set(index, audioPromise);

  return audioPromise;
}

async function _loadGLTFAudio(ctx: GameState, resource: GLTFResource, index: number): Promise<RemoteAudioData> {
  if (!resource.root.extensions?.KHR_audio) {
    throw new Error("glTF file has no KHR_audio extension");
  }

  const audioExtension = resource.root.extensions?.KHR_audio;

  if (!audioExtension.audio || !audioExtension.audio[index]) {
    throw new Error(`Audio ${index} not found`);
  }

  const audio = audioExtension.audio[index];

  let remoteAudio: RemoteAudioData;

  if (audio.uri) {
    const uri = resource.fileMap.get(audio.uri) || audio.uri;
    remoteAudio = createRemoteAudioData(ctx, { name: audio.name, uri: resolveURL(uri, resource.baseUrl) });
  } else if (audio.bufferView !== undefined) {
    if (!audio.mimeType) {
      throw new Error(`audio[${index}] has a bufferView but no mimeType`);
    }

    const remoteBufferView = await loadGLTFBufferView(resource, audio.bufferView);

    remoteAudio = createRemoteAudioFromBufferView(ctx, {
      name: audio.name,
      bufferView: remoteBufferView,
      mimeType: audio.mimeType,
    });
  } else {
    throw new Error(`audio[${index}] has no uri or bufferView`);
  }

  resource.audio.set(index, remoteAudio);

  return remoteAudio;
}

export async function loadGLTFAudioSource(
  ctx: GameState,
  resource: GLTFResource,
  index: number
): Promise<RemoteAudioSource> {
  let audioSourcePromise = resource.audioSourcePromises.get(index);

  if (audioSourcePromise) {
    return audioSourcePromise;
  }

  audioSourcePromise = _loadGLTFAudioSource(ctx, resource, index);

  resource.audioSourcePromises.set(index, audioSourcePromise);

  return audioSourcePromise;
}

async function _loadGLTFAudioSource(ctx: GameState, resource: GLTFResource, index: number): Promise<RemoteAudioSource> {
  if (!resource.root.extensions?.KHR_audio) {
    throw new Error("glTF file has no KHR_audio extension");
  }

  const audioExtension = resource.root.extensions?.KHR_audio;

  if (!audioExtension.sources || !audioExtension.sources[index]) {
    throw new Error(`AudioSource ${index} not found`);
  }

  const audioSource = audioExtension.sources[index];

  const remoteAudioSource = createRemoteAudioSource(ctx, {
    name: audioSource.name,
    gain: audioSource.gain,
    loop: audioSource.loop,
    autoPlay: audioSource.autoPlay,
    audio: audioSource.audio !== undefined ? await loadGLTFAudio(ctx, resource, audioSource.audio) : undefined,
  });

  resource.audioSources.set(index, remoteAudioSource);

  return remoteAudioSource;
}

export async function loadGLTFAudioEmitter<Emitter extends RemoteAudioEmitter>(
  ctx: GameState,
  resource: GLTFResource,
  index: number,
  output: AudioEmitterOutput = AudioEmitterOutput.Environment
): Promise<Emitter> {
  const result = resource.audioEmitterPromises.get(index);

  if (result) {
    if (result.output !== output) {
      throw new Error(`AudioEmitter output ${output} does not match output ${result.output} of existing emitter.`);
    }

    return result.promise as Promise<Emitter>;
  }

  const promise = _loadGLTFAudioEmitter<Emitter>(ctx, resource, index, output);

  resource.audioEmitterPromises.set(index, { output, promise });

  return promise;
}

async function _loadGLTFAudioEmitter<Emitter extends RemoteAudioEmitter>(
  ctx: GameState,
  resource: GLTFResource,
  index: number,
  output: AudioEmitterOutput
): Promise<Emitter> {
  if (!resource.root.extensions?.KHR_audio) {
    throw new Error("glTF file has no KHR_audio extension");
  }

  const audioExtension = resource.root.extensions?.KHR_audio;

  if (!audioExtension.emitters || !audioExtension.emitters[index]) {
    throw new Error(`AudioEmitter ${index} not found`);
  }

  const audioEmitter = audioExtension.emitters[index];

  let remoteAudioEmitter: RemoteAudioEmitter;

  const sources = audioEmitter.sources
    ? await Promise.all(audioEmitter.sources.map((sourceIndex) => loadGLTFAudioSource(ctx, resource, sourceIndex)))
    : [];

  if (audioEmitter.type === "global") {
    remoteAudioEmitter = createRemoteGlobalAudioEmitter(ctx, {
      name: audioEmitter.name,
      gain: audioEmitter.gain,
      sources,
      output,
    });
  } else if (audioEmitter.type === "positional") {
    remoteAudioEmitter = createRemotePositionalAudioEmitter(ctx, {
      name: audioEmitter.name,
      coneInnerAngle: audioEmitter.coneInnerAngle,
      coneOuterAngle: audioEmitter.coneOuterAngle,
      coneOuterGain: audioEmitter.coneOuterGain,
      distanceModel: audioEmitter.distanceModel,
      maxDistance: audioEmitter.maxDistance,
      refDistance: audioEmitter.refDistance,
      rolloffFactor: audioEmitter.rolloffFactor,
      gain: audioEmitter.gain,
      sources,
      output,
    });
  } else {
    throw new Error(`Unknown audio emitter type ${audioEmitter.type}`);
  }

  resource.audioEmitters.set(index, remoteAudioEmitter);

  return remoteAudioEmitter as Emitter;
}
