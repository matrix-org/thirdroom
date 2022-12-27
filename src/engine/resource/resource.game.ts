import { createTripleBuffer, getWriteBufferIndex, TripleBuffer } from "../allocator/TripleBuffer";
import { GameState } from "../GameTypes";
import { defineModule, getModule, registerMessageHandler, Thread } from "../module/module.common";
import { createDisposables } from "../utils/createDisposables";
import { createDeferred, Deferred } from "../utils/Deferred";
import { defineRemoteResourceClass } from "./RemoteResourceClass";
import {
  ArrayBufferResourceType,
  CreateResourceMessage,
  LoadResourcesMessage,
  ResourceDisposedError,
  ResourceId,
  ResourceLoadedMessage,
  ResourceMessageType,
  ResourceProps,
  StringResourceType,
} from "./resource.common";
import {
  InitialRemoteResourceProps,
  IRemoteResourceClass,
  IRemoteResourceManager,
  RemoteResource,
  ResourceDefinition,
} from "./ResourceDefinition";
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

export interface ResourceTransformData {
  writeView: Uint8Array;
  refView: Uint32Array;
  refOffsets: number[];
  refIsString: boolean[];
}

interface ResourceModuleState {
  resourceIdCounter: number;
  resourceInfos: Map<ResourceId, ResourceInfo>;
  resourcesByType: Map<ResourceType, RemoteResource[]>;
  disposedResources: ResourceId[];
  messageQueue: CreateResourceMessage[];
  resourceConstructors: Map<ResourceDefinition, IRemoteResourceClass>;
  resourceTransformData: Map<number, ResourceTransformData>;
  resourceDefByType: Map<number, ResourceDefinition>;
}

type RemoteResourceTypes = string | ArrayBuffer | RemoteResource;

interface ResourceInfo {
  resource: RemoteResourceTypes;
  refCount: number;
  statusBuffer: TripleBuffer;
  deferred: Deferred<undefined>;
  dispose?: () => void;
}

export const ResourceModule = defineModule<GameState, ResourceModuleState>({
  name: "resource",
  create(ctx: GameState) {
    return {
      resourceIdCounter: 1,
      resourceConstructors: new Map(),
      resourceTransformData: new Map(),
      resourceDefByType: new Map(),
      disposedResources: [],
      resourceInfos: new Map(),
      resourcesByType: new Map(),
      messageQueue: [],
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

  const deferred = resourceModule.resourceInfos.get(id)?.deferred;

  if (!deferred) {
    return;
  }

  if (error) {
    deferred.reject(error);
  } else {
    deferred.resolve(undefined);
  }
}

function createResource(
  ctx: GameState,
  resourceType: string,
  props: ResourceProps,
  resource: RemoteResourceTypes,
  dispose?: () => void
): number {
  const resourceModule = getModule(ctx, ResourceModule);
  const id = resourceModule.resourceIdCounter++;
  const statusBuffer = createTripleBuffer(ctx.gameToRenderTripleBufferFlags, 1);

  const deferred = createDeferred<undefined>();

  deferred.promise.catch((error) => {
    if (error instanceof ResourceDisposedError) {
      return;
    }

    console.error(error);
  });

  resourceModule.resourceInfos.set(id, {
    resource,
    refCount: 0,
    dispose,
    statusBuffer,
    deferred,
  });

  resourceModule.messageQueue.push({
    resourceType,
    id,
    props,
    statusBuffer,
  });

  return id;
}

export function createRemoteResource(ctx: GameState, resource: RemoteResource): number {
  const resourceId = createResource(ctx, resource.constructor.resourceDef.name, resource.tripleBuffer, resource);

  const { resourcesByType } = getModule(ctx, ResourceModule);

  const resourceType = resource.resourceType;
  let resourceArr = resourcesByType.get(resourceType);

  if (!resourceArr) {
    resourceArr = [];
    resourcesByType.set(resourceType, resourceArr);
  }

  resourceArr.push(resource as unknown as RemoteResource);

  return resourceId;
}

export function createStringResource(ctx: GameState, value: string, dispose?: () => void): ResourceId {
  return createResource(ctx, StringResourceType, value, value, dispose);
}

export function createArrayBufferResource(ctx: GameState, value: SharedArrayBuffer): ResourceId {
  return createResource(ctx, ArrayBufferResourceType, value, value);
}

export function removeResourceRef(ctx: GameState, resourceId: ResourceId): boolean {
  const resourceModule = getModule(ctx, ResourceModule);

  const resourceInfo = resourceModule.resourceInfos.get(resourceId);

  if (!resourceInfo) {
    return false;
  }

  const refCount = resourceInfo.refCount--;

  if (refCount > 0) {
    return false;
  }

  if (resourceInfo.dispose) {
    resourceInfo.dispose();
  }

  resourceModule.disposedResources.push(resourceId);
  resourceModule.resourceInfos.delete(resourceId);

  const resource = resourceInfo.resource;

  if (typeof resource !== "string" && "resourceType" in resource) {
    const resourceType = resource.resourceType;
    const resourceArr = resourceModule.resourcesByType.get(resourceType);

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

  resourceInfo.deferred.reject(new ResourceDisposedError("Resource disposed"));

  return true;
}

export function addResourceRef(ctx: GameState, resourceId: ResourceId) {
  const resourceModule = getModule(ctx, ResourceModule);

  const resourceInfo = resourceModule.resourceInfos.get(resourceId);

  if (resourceInfo) {
    resourceInfo.refCount++;
  }
}

export function getRemoteResource<Res>(ctx: GameState, resourceId: ResourceId): Res | undefined {
  return getModule(ctx, ResourceModule).resourceInfos.get(resourceId)?.resource as Res | undefined;
}

export function getRemoteResources<Def extends ResourceDefinition, T extends RemoteResource>(
  ctx: GameState,
  resourceClass: { new (manager: IRemoteResourceManager, props?: InitialRemoteResourceProps<Def>): T; resourceDef: Def }
): T[] {
  return (getModule(ctx, ResourceModule).resourcesByType.get(resourceClass.resourceDef.resourceType) || []) as T[];
}

export function ResourceLoaderSystem(ctx: GameState) {
  const { messageQueue, resourceInfos, disposedResources } = getModule(ctx, ResourceModule);

  for (let i = disposedResources.length - 1; i >= 0; i--) {
    const resourceId = disposedResources[i];
    disposedResources.splice(i, 1);

    const resourceInfo = resourceInfos.get(resourceId);

    if (resourceInfo) {
      const statusBuffer = resourceInfo.statusBuffer;
      const index = getWriteBufferIndex(statusBuffer);
      statusBuffer.byteViews[index][0] = 1;
    }
  }

  if (messageQueue.length !== 0) {
    ctx.sendMessage<LoadResourcesMessage>(Thread.Main, {
      type: ResourceMessageType.LoadResources,
      resources: messageQueue,
    });

    ctx.sendMessage<LoadResourcesMessage>(Thread.Render, {
      type: ResourceMessageType.LoadResources,
      resources: messageQueue,
    });

    messageQueue.length = 0;
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
  declare attributes: RemoteAccessor[];
  declare indices: RemoteAccessor | undefined;
  declare material: RemoteMaterial | undefined;
  declare mode: MeshPrimitiveMode;
}

export class RemoteInstancedMesh extends defineRemoteResourceClass(InstancedMeshResource) {
  declare attributes: RemoteAccessor[];
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
