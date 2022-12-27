import { AudioModule } from "../audio/audio.main";
import { IMainThreadContext } from "../MainThread";
import { getModule } from "../module/module.common";
import { toArrayBuffer } from "../utils/arraybuffer";
import { defineLocalResourceClass } from "./LocalResourceClass";
import { createLocalResourceModule, ResourceId } from "./resource.common";
import {
  AccessorComponentType,
  AccessorResource,
  AccessorType,
  AudioDataResource,
  AudioEmitterDistanceModel,
  AudioEmitterOutput,
  AudioEmitterResource,
  AudioEmitterType,
  AudioSourceResource,
  BufferResource,
  BufferViewResource,
  BufferViewTarget,
  CameraResource,
  CameraType,
  ImageResource,
  InstancedMeshResource,
  InteractableResource,
  InteractableType,
  LightMapResource,
  LightResource,
  LightType,
  MaterialAlphaMode,
  MaterialResource,
  MaterialType,
  MeshPrimitiveMode,
  MeshPrimitiveResource,
  MeshResource,
  NametagResource,
  NodeResource,
  ReflectionProbeResource,
  ResourceType,
  SamplerMagFilter,
  SamplerMapping,
  SamplerMinFilter,
  SamplerResource,
  SamplerWrap,
  SceneResource,
  SkinResource,
  SparseAccessorResource,
  TextureEncoding,
  TextureResource,
  TilesRendererResource,
} from "./schema";

export {
  ResourceModule,
  getLocalResource,
  getLocalResources,
  waitForLocalResource,
  registerResource,
  registerResourceLoader,
  getResourceDisposed,
  ResourceDisposalSystem,
};

export class MainNametag extends defineLocalResourceClass<typeof NametagResource, IMainThreadContext>(NametagResource) {
  declare resourceType: ResourceType.Nametag;

  async load(ctx: IMainThreadContext) {
    const audioModule = getModule(ctx, AudioModule);
    const nametags = getLocalResources(ctx, MainNametag);
    audioModule.eventEmitter.emit("nametags-changed", [...nametags, this]);
  }
}

export class MainSampler extends defineLocalResourceClass(SamplerResource) {
  declare magFilter: SamplerMagFilter;
  declare minFilter: SamplerMinFilter;
  declare wrapS: SamplerWrap;
  declare wrapT: SamplerWrap;
  declare mapping: SamplerMapping;
}

export class MainBuffer extends defineLocalResourceClass(BufferResource) {}

export class MainBufferView extends defineLocalResourceClass(BufferViewResource) {
  declare buffer: MainBuffer;
  declare target: BufferViewTarget;
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

export class MainAudioData extends defineLocalResourceClass<typeof AudioDataResource, IMainThreadContext>(
  AudioDataResource
) {
  declare bufferView: MainBufferView | undefined;
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

export class MainAudioSource extends defineLocalResourceClass<typeof AudioSourceResource, IMainThreadContext>(
  AudioSourceResource
) {
  declare audio: MainAudioData | undefined;
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

export class MainAudioEmitter extends defineLocalResourceClass<typeof AudioEmitterResource, IMainThreadContext>(
  AudioEmitterResource
) {
  declare type: AudioEmitterType;
  declare sources: MainAudioSource[];
  declare distanceModel: AudioEmitterDistanceModel;
  declare output: AudioEmitterOutput;
  activeSources: MainAudioSource[] = [];
  inputGain: GainNode | undefined;
  outputGain: GainNode | undefined;
  destination: AudioNode | undefined;

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
    this.destination = destination;

    if (this.type === AudioEmitterType.Global) {
      this.inputGain.connect(this.outputGain);
    }
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

export class MainImage extends defineLocalResourceClass(ImageResource) {
  declare bufferView: MainBufferView | undefined;
}

export class MainTexture extends defineLocalResourceClass(TextureResource) {
  declare sampler: MainSampler | undefined;
  declare source: MainImage;
  declare encoding: TextureEncoding;
}

export class MainReflectionProbe extends defineLocalResourceClass(ReflectionProbeResource) {
  declare reflectionProbeTexture: MainTexture | undefined;
}

export class MainMaterial extends defineLocalResourceClass(MaterialResource) {
  declare type: MaterialType;
  declare alphaMode: MaterialAlphaMode;
  declare baseColorTexture: MainTexture | undefined;
  declare metallicRoughnessTexture: MainTexture | undefined;
  declare normalTexture: MainTexture | undefined;
  declare occlusionTexture: MainTexture | undefined;
  declare emissiveTexture: MainTexture | undefined;
  declare transmissionTexture: MainTexture | undefined;
  declare thicknessTexture: MainTexture | undefined;
}

export class MainLight extends defineLocalResourceClass(LightResource) {
  declare type: LightType;
}

export class MainCamera extends defineLocalResourceClass(CameraResource) {
  declare type: CameraType;
}

export class MainSparseAccessor extends defineLocalResourceClass(SparseAccessorResource) {
  declare indicesBufferView: MainBufferView;
  declare indicesComponentType: AccessorComponentType;
  declare valuesBufferView: MainBufferView;
}

export class MainAccessor extends defineLocalResourceClass(AccessorResource) {
  declare bufferView: MainBufferView | undefined;
  declare componentType: AccessorComponentType;
  declare type: AccessorType;
  declare sparse: MainSparseAccessor | undefined;
}

export class MainMeshPrimitive extends defineLocalResourceClass(MeshPrimitiveResource) {
  declare attributes: MainAccessor[];
  declare indices: MainAccessor | undefined;
  declare material: MainMaterial | undefined;
  declare mode: MeshPrimitiveMode;
}

export class MainInstancedMesh extends defineLocalResourceClass(InstancedMeshResource) {
  declare attributes: MainAccessor[];
}

export class MainMesh extends defineLocalResourceClass(MeshResource) {
  declare primitives: MainMeshPrimitive[];
}

export class MainLightMap extends defineLocalResourceClass(LightMapResource) {
  declare texture: MainTexture;
}

export class MainTilesRenderer extends defineLocalResourceClass(TilesRendererResource) {}

export class MainSkin extends defineLocalResourceClass(SkinResource) {
  declare joints: MainNode[];
  declare inverseBindMatrices: MainAccessor | undefined;
}

export class MainInteractable extends defineLocalResourceClass(InteractableResource) {
  declare type: InteractableType;
}

export class MainNode extends defineLocalResourceClass(NodeResource) {
  declare resourceType: ResourceType.Node;
  declare parentScene: MainScene | undefined;
  declare parent: MainNode | undefined;
  declare firstChild: MainNode | undefined;
  declare prevSibling: MainNode | undefined;
  declare nextSibling: MainNode | undefined;
  declare mesh: MainMesh | undefined;
  declare instancedMesh: MainInstancedMesh | undefined;
  declare lightMap: MainLightMap | undefined;
  declare skin: MainSkin | undefined;
  declare light: MainLight | undefined;
  declare reflectionProbe: MainReflectionProbe | undefined;
  declare camera: MainCamera | undefined;
  declare audioEmitter: MainAudioEmitter | undefined;
  declare tilesRenderer: MainTilesRenderer | undefined;
  declare nametag: MainNametag | undefined;
  declare interactable: MainInteractable | undefined;
  currentAudioEmitterResourceId = 0;
  emitterInputNode?: GainNode;
  emitterPannerNode?: PannerNode;
  emitterOutput?: AudioEmitterOutput;

  dispose() {
    if (this.emitterPannerNode) {
      if (this.emitterInputNode) {
        this.emitterInputNode.disconnect(this.emitterPannerNode);
      }

      this.emitterPannerNode.disconnect();
    }
  }
}

export class MainScene extends defineLocalResourceClass(SceneResource) {
  declare resourceType: ResourceType.Scene;
  declare backgroundTexture: MainTexture | undefined;
  declare reflectionProbe: MainReflectionProbe | undefined;
  declare audioEmitters: MainAudioEmitter[];
  declare firstNode: MainNode | undefined;
}

const {
  ResourceModule,
  getLocalResource,
  getLocalResources,
  waitForLocalResource,
  registerResource,
  registerResourceLoader,
  getResourceDisposed,
  ResourceDisposalSystem,
} = createLocalResourceModule<IMainThreadContext>([
  MainNode,
  MainAudioData,
  MainAudioSource,
  MainAudioEmitter,
  MainNametag,
  MainLight,
  MainSampler,
  MainCamera,
  MainBuffer,
  MainBufferView,
  MainImage,
  MainMaterial,
  MainTexture,
  MainMesh,
  MainScene,
  MainMeshPrimitive,
  MainInteractable,
  MainAccessor,
  MainSparseAccessor,
  MainSkin,
  MainInstancedMesh,
  MainLightMap,
  MainReflectionProbe,
  MainTilesRenderer,
]);
