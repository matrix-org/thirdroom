import { createTripleBuffer, getWriteBufferIndex, TripleBuffer } from "../allocator/TripleBuffer";
import { GameState } from "../GameTypes";
import { defineModule, getModule, registerMessageHandler, Thread } from "../module/module.common";
import { createDisposables } from "../utils/createDisposables";
import { createDeferred, Deferred } from "../utils/Deferred";
import { defineRemoteResourceClass } from "./RemoteResourceClass";
import {
  ArrayBufferResourceType,
  LoadResourcesMessage,
  ResourceDisposedError,
  ResourceId,
  ResourceLoadedMessage,
  ResourceMessageType,
  StringResourceType,
} from "./resource.common";
import { IRemoteResourceClass, RemoteResource, ResourceDefinition } from "./ResourceDefinition";
import {
  NametagResource,
  SamplerResource,
  BufferResource,
  BufferViewResource,
  AudioDataResource,
  AudioSourceResource,
  AudioEmitterResource,
  ImageResource,
  TextureResource,
  ReflectionProbeResource,
  MaterialResource,
  LightResource,
  CameraResource,
  SparseAccessorResource,
  AccessorResource,
  MeshPrimitiveResource,
  InstancedMeshResource,
  MeshResource,
  LightMapResource,
  TilesRendererResource,
  SkinResource,
  InteractableResource,
  NodeResource,
  SceneResource,
  InteractableType,
  MeshPrimitiveMode,
  AccessorComponentType,
  AccessorType,
  CameraType,
  LightType,
  MaterialType,
  MaterialAlphaMode,
  AudioEmitterType,
  AudioEmitterDistanceModel,
  AudioEmitterOutput,
  BufferViewTarget,
  SamplerMagFilter,
  SamplerMinFilter,
  SamplerWrap,
  SamplerMapping,
  TextureEncoding,
  ResourceType,
} from "./schema";

interface RemoteResourceInfo {
  id: ResourceId;
  name: string;
  thread: Thread;
  resourceType: string;
  props: any;
  loaded: boolean;
  error?: string;
  cacheKey?: string;
  refCount: number;
  dispose?: () => void;
}

interface ResourceTransformData {
  writeView: Uint8Array;
  refView: Uint32Array;
  refOffsets: number[];
  refIsString: boolean[];
}

interface ResourceModuleState {
  resourceIdCounter: number;
  resources: Map<ResourceId, any>;
  disposedResources: ResourceId[];
  resourceStatusTripleBuffers: Map<ResourceId, TripleBuffer>;
  resourcesByType: Map<ResourceDefinition, RemoteResource<any>[]>;
  resourceInfos: Map<ResourceId, RemoteResourceInfo>;
  resourceIdMap: Map<string, Map<any, ResourceId>>;
  deferredResources: Map<ResourceId, Deferred<undefined>>;
  mainThreadMessageQueue: any[];
  renderThreadMessageQueue: any[];
  mainThreadTransferList: Transferable[];
  renderThreadTransferList: Transferable[];
  resourceConstructors: Map<ResourceDefinition, IRemoteResourceClass<ResourceDefinition>>;
  resourceTransformData: Map<number, ResourceTransformData>;
  resourceDefByType: Map<number, ResourceDefinition>;
}

export const ResourceModule = defineModule<GameState, ResourceModuleState>({
  name: "resource",
  create(ctx: GameState) {
    return {
      resourceIdCounter: 1,
      resourceConstructors: new Map(),
      resourceTransformData: new Map(),
      resourceDefByType: new Map(),
      resources: new Map(),
      disposedResources: [],
      resourceStatusTripleBuffers: new Map(),
      resourcesByType: new Map(),
      resourceInfos: new Map(),
      resourceIdMap: new Map(),
      deferredResources: new Map(),
      mainThreadMessageQueue: [],
      renderThreadMessageQueue: [],
      mainThreadTransferList: [],
      renderThreadTransferList: [],
    };
  },
  init(ctx) {
    return createDisposables([
      registerResource(ctx, NametagResource),
      registerResource(ctx, SamplerResource),
      registerResource(ctx, BufferResource),
      registerResource(ctx, BufferViewResource),
      registerResource(ctx, AudioDataResource),
      registerResource(ctx, AudioSourceResource),
      registerResource(ctx, AudioEmitterResource),
      registerResource(ctx, ImageResource),
      registerResource(ctx, TextureResource),
      registerResource(ctx, ReflectionProbeResource),
      registerResource(ctx, MaterialResource),
      registerResource(ctx, LightResource),
      registerResource(ctx, CameraResource),
      registerResource(ctx, SparseAccessorResource),
      registerResource(ctx, AccessorResource),
      registerResource(ctx, MeshPrimitiveResource),
      registerResource(ctx, InstancedMeshResource),
      registerResource(ctx, MeshResource),
      registerResource(ctx, LightMapResource),
      registerResource(ctx, TilesRendererResource),
      registerResource(ctx, SkinResource),
      registerResource(ctx, InteractableResource),
      registerResource(ctx, NodeResource),
      registerResource(ctx, SceneResource),
      registerMessageHandler(ctx, ResourceMessageType.ResourceLoaded, onResourceLoaded),
    ]);
  },
});

function registerResource<Def extends ResourceDefinition>(
  ctx: GameState,
  resourceDefOrClass: Def | IRemoteResourceClass<Def>
) {
  const resourceModule = getModule(ctx, ResourceModule);

  const RemoteResourceClass =
    "resourceDef" in resourceDefOrClass ? resourceDefOrClass : defineRemoteResourceClass(resourceDefOrClass);

  const resourceDef = RemoteResourceClass.resourceDef;

  resourceModule.resourceConstructors.set(
    resourceDef,
    RemoteResourceClass as unknown as IRemoteResourceClass<ResourceDefinition>
  );

  resourceModule.resourceDefByType.set(resourceDef.resourceType, resourceDef);

  const buffer = new ArrayBuffer(resourceDef.byteLength);
  const writeView = new Uint8Array(buffer);
  const refView = new Uint32Array(buffer);
  const refOffsets: number[] = [];
  const refIsString: boolean[] = [];

  const schema = resourceDef.schema;

  for (const propName in schema) {
    const prop = schema[propName];

    if (prop.type === "ref" || prop.type === "refArray" || prop.type === "refMap" || prop.type === "string") {
      for (let i = 0; i < prop.size; i++) {
        refOffsets.push(prop.byteOffset + i * prop.arrayType.BYTES_PER_ELEMENT);
        refIsString.push(prop.type === "string");
      }
    } else if (prop.type === "arrayBuffer") {
      refOffsets.push(prop.byteOffset + Uint32Array.BYTES_PER_ELEMENT);
      refIsString.push(false);
    }
  }

  resourceModule.resourceTransformData.set(resourceDef.resourceType, {
    writeView,
    refView,
    refOffsets,
    refIsString,
  });

  return () => {
    resourceModule.resourceConstructors.delete(RemoteResourceClass.resourceDef);
  };
}

function onResourceLoaded(ctx: GameState, { id, loaded, error }: ResourceLoadedMessage) {
  const resourceModule = getModule(ctx, ResourceModule);

  const resourceInfo = resourceModule.resourceInfos.get(id);

  if (!resourceInfo) {
    return;
  }

  const deferred = resourceModule.deferredResources.get(id);

  if (!deferred) {
    return;
  }

  resourceInfo.loaded = loaded;
  resourceInfo.error = error;

  if (error) {
    deferred.reject(error);
  } else {
    deferred.resolve(undefined);
  }
}

interface ResourceOptions {
  name?: string;
  transferList?: Transferable[];
  cacheKey?: any;
  dispose?: () => void;
}

const UNKNOWN_RESOURCE_NAME = "Unknown Resource";

export function createResource<Props>(
  ctx: GameState,
  thread: Thread,
  resourceType: string,
  props: Props,
  options?: ResourceOptions
): number {
  const resourceModule = getModule(ctx, ResourceModule);

  let resourceCache = resourceModule.resourceIdMap.get(resourceType);

  if (resourceCache) {
    if (options?.cacheKey !== undefined) {
      const existingResourceId = resourceCache.get(options.cacheKey);

      if (existingResourceId !== undefined) {
        return existingResourceId;
      }
    }
  } else {
    resourceCache = new Map();
    resourceModule.resourceIdMap.set(resourceType, resourceCache);
  }

  const id = resourceModule.resourceIdCounter++;

  // First byte loading flag, second byte is dispose flag
  const statusBuffer = createTripleBuffer(ctx.gameToRenderTripleBufferFlags, 1);
  resourceModule.resourceStatusTripleBuffers.set(id, statusBuffer);

  const name = options?.name || UNKNOWN_RESOURCE_NAME;

  resourceModule.resourceInfos.set(id, {
    id,
    name,
    thread,
    resourceType,
    props,
    loaded: false,
    cacheKey: options?.cacheKey,
    refCount: 0,
    dispose: options?.dispose,
  });

  if (options?.cacheKey !== undefined) {
    resourceCache.set(options.cacheKey, id);
  }

  const deferred = createDeferred<undefined>();

  deferred.promise.catch((error) => {
    if (error instanceof ResourceDisposedError) {
      return;
    }

    console.error(error);
  });

  resourceModule.deferredResources.set(id, deferred);

  const message = {
    resourceType,
    id,
    name,
    props,
    statusBuffer,
  };

  if (thread === Thread.Game) {
    throw new Error("Invalid resource thread target");
  }

  if (thread === Thread.Shared && options?.transferList) {
    throw new Error("Cannot transfer resources to multiple threads");
  }

  if (thread === Thread.Main || thread === Thread.Shared) {
    resourceModule.mainThreadMessageQueue.push(message);

    if (options?.transferList) {
      resourceModule.mainThreadTransferList.push(...options.transferList);
    }
  }

  if (thread === Thread.Render || thread === Thread.Shared) {
    resourceModule.renderThreadMessageQueue.push(message);

    if (options?.transferList) {
      resourceModule.renderThreadTransferList.push(...options.transferList);
    }
  }

  return id;
}

export function createStringResource(ctx: GameState, value: string): ResourceId {
  const resourceModule = getModule(ctx, ResourceModule);
  const resourceId = createResource(ctx, Thread.Shared, StringResourceType, value);
  resourceModule.resources.set(resourceId, value);
  return resourceId;
}

export function createArrayBufferResource(ctx: GameState, value: SharedArrayBuffer): ResourceId {
  const resourceModule = getModule(ctx, ResourceModule);
  const resourceId = createResource(ctx, Thread.Shared, ArrayBufferResourceType, value);
  resourceModule.resources.set(resourceId, value);
  return resourceId;
}

export function disposeResource(ctx: GameState, resourceId: ResourceId): boolean {
  const resourceModule = getModule(ctx, ResourceModule);

  const resourceInfo = resourceModule.resourceInfos.get(resourceId);

  if (!resourceInfo) {
    return false;
  }

  resourceInfo.refCount--;

  if (resourceInfo.refCount > 0) {
    return false;
  }

  resourceModule.disposedResources.push(resourceId);

  if (resourceInfo.dispose) {
    resourceInfo.dispose();
  }

  if (resourceInfo.cacheKey) {
    const resourceTypeCache = resourceModule.resourceIdMap.get(resourceInfo.resourceType);

    if (resourceTypeCache) {
      resourceTypeCache.delete(resourceInfo.cacheKey);
    }
  }

  const deferred = resourceModule.deferredResources.get(resourceId);

  if (deferred) {
    deferred.reject(new ResourceDisposedError("Resource disposed"));
    resourceModule.deferredResources.delete(resourceId);
  }

  resourceModule.resourceInfos.delete(resourceId);

  const resource = resourceModule.resources.get(resourceId);

  const resourceDef = resource?.constructor?.resourceDef;

  if (resourceDef) {
    const resourceArr = resourceModule.resourcesByType.get(resourceDef);

    if (resourceArr) {
      const index = resourceArr.indexOf(resource);

      if (index !== -1) {
        resourceArr.splice(index, 1);
      }
    }

    if (resource.dispose) {
      resource.dispose();
    }
  }

  resourceModule.resources.delete(resourceId);

  return true;
}

export function addResourceRef(ctx: GameState, resourceId: ResourceId) {
  const resourceModule = getModule(ctx, ResourceModule);

  const resourceInfo = resourceModule.resourceInfos.get(resourceId);

  if (resourceInfo) {
    resourceInfo.refCount++;
  }
}

export function waitForRemoteResource(ctx: GameState, resourceId: ResourceId): Promise<undefined> {
  const resourceModule = getModule(ctx, ResourceModule);
  const deferred = resourceModule.deferredResources.get(resourceId);

  if (deferred) {
    return deferred.promise;
  }

  return Promise.reject(new Error(`Resource ${resourceId} not found.`));
}

export function setRemoteResource<Res extends RemoteResource<any>>(
  ctx: GameState,
  resourceId: ResourceId,
  resource: Res
): void {
  const { resources, resourcesByType } = getModule(ctx, ResourceModule);

  resources.set(resourceId, resource);

  const resourceDef = resource.constructor.resourceDef;
  let resourceArr = resourcesByType.get(resourceDef);

  if (!resourceArr) {
    resourceArr = [];
    resourcesByType.set(resourceDef, resourceArr);
  }

  resourceArr.push(resource);
}

export function getRemoteResource<Res>(ctx: GameState, resourceId: ResourceId): Res | undefined {
  return getModule(ctx, ResourceModule).resources.get(resourceId) as Res | undefined;
}

export function getRemoteResources<Def extends ResourceDefinition>(
  ctx: GameState,
  resourceDef: Def
): RemoteResource<Def>[] {
  return (getModule(ctx, ResourceModule).resourcesByType.get(resourceDef) || []) as unknown as RemoteResource<Def>[];
}

export function ResourceLoaderSystem(ctx: GameState) {
  const resourceModule = getModule(ctx, ResourceModule);

  const disposedResources = resourceModule.disposedResources;
  const resourceStatusTripleBuffers = resourceModule.resourceStatusTripleBuffers;

  for (let i = disposedResources.length - 1; i >= 0; i--) {
    const resourceId = disposedResources[i];
    disposedResources.splice(i, 1);
    const statusBuffer = resourceStatusTripleBuffers.get(resourceId);

    if (statusBuffer) {
      const index = getWriteBufferIndex(statusBuffer);
      statusBuffer.byteViews[index][0] = 1;
    }
  }

  if (resourceModule.mainThreadMessageQueue.length !== 0) {
    ctx.sendMessage<LoadResourcesMessage>(
      Thread.Main,
      {
        type: ResourceMessageType.LoadResources,
        resources: resourceModule.mainThreadMessageQueue,
      },
      resourceModule.mainThreadTransferList.length > 0 ? resourceModule.mainThreadTransferList : undefined
    );

    resourceModule.mainThreadMessageQueue = [];

    if (resourceModule.mainThreadTransferList.length > 0) {
      resourceModule.mainThreadTransferList = [];
    }
  }

  if (resourceModule.renderThreadMessageQueue.length !== 0) {
    ctx.sendMessage<LoadResourcesMessage>(
      Thread.Render,
      {
        type: ResourceMessageType.LoadResources,
        resources: resourceModule.renderThreadMessageQueue,
      },
      resourceModule.renderThreadTransferList.length > 0 ? resourceModule.renderThreadTransferList : undefined
    );

    resourceModule.renderThreadMessageQueue = [];

    if (resourceModule.renderThreadTransferList.length > 0) {
      resourceModule.renderThreadTransferList = [];
    }
  }
}

export class RemoteNametag extends defineRemoteResourceClass(NametagResource) {
  declare resourceType: ResourceType.Nametag;
}

export class RemoteSampler extends defineRemoteResourceClass(SamplerResource) {
  declare magFilter: SamplerMagFilter;
  declare minFilter: SamplerMinFilter;
  declare wrapS: SamplerWrap;
  declare wrapT: SamplerWrap;
  declare mapping: SamplerMapping;
}

export class RemoteBuffer extends defineRemoteResourceClass(BufferResource) {}

export class RemoteBufferView extends defineRemoteResourceClass(BufferViewResource) {
  declare buffer: RemoteBuffer;
  declare target: BufferViewTarget;
}

export class RemoteAudioData extends defineRemoteResourceClass(AudioDataResource) {
  declare bufferView: RemoteBufferView | undefined;
}

export class RemoteAudioSource extends defineRemoteResourceClass(AudioSourceResource) {
  declare audio: RemoteAudioData | undefined;
}

export class RemoteAudioEmitter extends defineRemoteResourceClass(AudioEmitterResource) {
  declare type: AudioEmitterType;
  declare sources: RemoteAudioSource[];
  declare distanceModel: AudioEmitterDistanceModel;
  declare output: AudioEmitterOutput;
}

export class RemoteImage extends defineRemoteResourceClass(ImageResource) {
  declare bufferView: RemoteBufferView | undefined;
}

export class RemoteTexture extends defineRemoteResourceClass(TextureResource) {
  declare sampler: RemoteSampler | undefined;
  declare source: RemoteImage;
  declare encoding: TextureEncoding;
}

export class RemoteReflectionProbe extends defineRemoteResourceClass(ReflectionProbeResource) {
  declare reflectionProbeTexture: RemoteTexture | undefined;
}

export class RemoteMaterial extends defineRemoteResourceClass(MaterialResource) {
  declare type: MaterialType;
  declare alphaMode: MaterialAlphaMode;
  declare baseColorTexture: RemoteTexture | undefined;
  declare metallicRoughnessTexture: RemoteTexture | undefined;
  declare normalTexture: RemoteTexture | undefined;
  declare occlusionTexture: RemoteTexture | undefined;
  declare emissiveTexture: RemoteTexture | undefined;
  declare transmissionTexture: RemoteTexture | undefined;
  declare thicknessTexture: RemoteTexture | undefined;
}

export class RemoteLight extends defineRemoteResourceClass(LightResource) {
  declare type: LightType;
}

export class RemoteCamera extends defineRemoteResourceClass(CameraResource) {
  declare type: CameraType;
}

export class RemoteSparseAccessor extends defineRemoteResourceClass(SparseAccessorResource) {
  declare indicesBufferView: RemoteBufferView;
  declare indicesComponentType: AccessorComponentType;
  declare valuesBufferView: RemoteBufferView;
}

export class RemoteAccessor extends defineRemoteResourceClass(AccessorResource) {
  declare bufferView: RemoteBufferView | undefined;
  declare componentType: AccessorComponentType;
  declare type: AccessorType;
  declare sparse: RemoteSparseAccessor | undefined;
}

export class RemoteMeshPrimitive extends defineRemoteResourceClass(MeshPrimitiveResource) {
  declare attrubutes: RemoteAccessor[];
  declare indices: RemoteAccessor | undefined;
  declare material: RemoteMaterial | undefined;
  declare mode: MeshPrimitiveMode;
}

export class RemoteInstancedMesh extends defineRemoteResourceClass(InstancedMeshResource) {
  declare attrubutes: RemoteAccessor[];
}

export class RemoteMesh extends defineRemoteResourceClass(MeshResource) {
  declare primitives: RemoteMeshPrimitive[];
}

export class RemoteLightMap extends defineRemoteResourceClass(LightMapResource) {
  declare texture: RemoteTexture;
}

export class RemoteTilesRenderer extends defineRemoteResourceClass(TilesRendererResource) {}

export class RemoteSkin extends defineRemoteResourceClass(SkinResource) {
  declare joints: RemoteNode[];
  declare inverseBindMatrices: RemoteAccessor | undefined;
}

export class RemoteInteractable extends defineRemoteResourceClass(InteractableResource) {
  declare type: InteractableType;
}

export class RemoteNode extends defineRemoteResourceClass(NodeResource) {
  declare resourceType: ResourceType.Node;
  declare parentScene: RemoteScene | undefined;
  declare parent: RemoteNode | undefined;
  declare firstChild: RemoteNode | undefined;
  declare prevSibling: RemoteNode | undefined;
  declare nextSibling: RemoteNode | undefined;
  declare mesh: RemoteMesh | undefined;
  declare instancedMesh: RemoteInstancedMesh | undefined;
  declare lightMap: RemoteLightMap | undefined;
  declare skin: RemoteSkin | undefined;
  declare light: RemoteLight | undefined;
  declare reflectionProbe: RemoteReflectionProbe | undefined;
  declare camera: RemoteCamera | undefined;
  declare audioEmitter: RemoteAudioEmitter | undefined;
  declare tilesRenderer: RemoteTilesRenderer | undefined;
  declare nametag: RemoteNametag | undefined;
  declare interactable: RemoteInteractable | undefined;
}

export class RemoteScene extends defineRemoteResourceClass(SceneResource) {
  declare resourceType: ResourceType.Scene;
  declare backgroundTexture: RemoteTexture | undefined;
  declare reflectionProbe: RemoteReflectionProbe | undefined;
  declare audioEmitters: RemoteAudioEmitter[];
  declare firstNode: RemoteNode | undefined;
}
