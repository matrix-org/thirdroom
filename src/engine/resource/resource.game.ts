import { addEntity, removeEntity } from "bitecs";
import { AnimationClip } from "three";

import { createTripleBuffer, getWriteBufferIndex, TripleBuffer } from "../allocator/TripleBuffer";
import { GameState } from "../GameTypes";
import { disposeGLTF, GLTFResource } from "../gltf/gltf.game";
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
  ResourceType,
  AnimationResource,
  AnimationChannelResource,
  AnimationSamplerResource,
  WorldResource,
  EnvironmentResource,
  AvatarResource,
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
  resourcesByType: Map<ResourceType, RemoteResource<GameState>[]>;
  messageQueue: CreateResourceMessage[];
  resourceConstructors: Map<ResourceDefinition, IRemoteResourceClass>;
  resourceTransformData: Map<number, ResourceTransformData>;
  resourceDefByType: Map<number, ResourceDefinition>;
}

type RemoteResourceTypes = string | ArrayBuffer | RemoteResource<GameState>;

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
      resourceInfos: new Map(),
      resourcesByType: new Map(),
      messageQueue: [],
    };
  },
  init(ctx) {
    const dispose = createDisposables([
      registerResource(ctx, RemoteNode),
      registerResource(ctx, RemoteAudioData),
      registerResource(ctx, RemoteAudioSource),
      registerResource(ctx, RemoteAudioEmitter),
      registerResource(ctx, RemoteNametag),
      registerResource(ctx, RemoteLight),
      registerResource(ctx, RemoteSampler),
      registerResource(ctx, RemoteCamera),
      registerResource(ctx, RemoteBuffer),
      registerResource(ctx, RemoteBufferView),
      registerResource(ctx, RemoteImage),
      registerResource(ctx, RemoteMaterial),
      registerResource(ctx, RemoteTexture),
      registerResource(ctx, RemoteMesh),
      registerResource(ctx, RemoteScene),
      registerResource(ctx, RemoteMeshPrimitive),
      registerResource(ctx, RemoteInteractable),
      registerResource(ctx, RemoteAccessor),
      registerResource(ctx, RemoteSparseAccessor),
      registerResource(ctx, RemoteSkin),
      registerResource(ctx, RemoteInstancedMesh),
      registerResource(ctx, RemoteLightMap),
      registerResource(ctx, RemoteReflectionProbe),
      registerResource(ctx, RemoteTilesRenderer),
      registerResource(ctx, RemoteAnimationChannel),
      registerResource(ctx, RemoteAnimationSampler),
      registerResource(ctx, RemoteAnimation),
      registerMessageHandler(ctx, ResourceMessageType.ResourceLoaded, onResourceLoaded),
    ]);

    ctx.worldResource = new RemoteWorld(ctx.resourceManager, {
      persistentScene: new RemoteScene(ctx.resourceManager, {
        eid: addEntity(ctx.world),
        name: "Persistent Scene",
      }),
    });

    return dispose;
  },
});

function registerResource<Def extends ResourceDefinition>(
  ctx: GameState,
  resourceDefOrClass: IRemoteResourceClass<Def>
) {
  const resourceModule = getModule(ctx, ResourceModule);

  const RemoteResourceClass = resourceDefOrClass;

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

export function createRemoteResource(ctx: GameState, resource: RemoteResource<GameState>): number {
  const resourceId = createResource(ctx, resource.constructor.resourceDef.name, resource.tripleBuffer, resource);

  const { resourcesByType } = getModule(ctx, ResourceModule);

  const resourceType = resource.resourceType;
  let resourceArr = resourcesByType.get(resourceType);

  if (!resourceArr) {
    resourceArr = [];
    resourcesByType.set(resourceType, resourceArr);
  }

  resourceArr.push(resource as unknown as RemoteResource<GameState>);

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

  const refCount = --resourceInfo.refCount;

  if (refCount > 0) {
    return false;
  }

  if (resourceInfo.dispose) {
    resourceInfo.dispose();
  }

  const statusBuffer = resourceInfo.statusBuffer;
  const index = getWriteBufferIndex(statusBuffer);
  statusBuffer.byteViews[index][0] = 1;

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
      resource.dispose(ctx);
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
    // console.log("addRef", resourceInfo.resource, resourceInfo.refCount);
  }
}

export function getRemoteResource<Res>(ctx: GameState, resourceId: ResourceId): Res | undefined {
  return getModule(ctx, ResourceModule).resourceInfos.get(resourceId)?.resource as Res | undefined;
}

export function getRemoteResources<Def extends ResourceDefinition, T extends RemoteResource<GameState>>(
  ctx: GameState,
  resourceClass: {
    new (manager: IRemoteResourceManager<GameState>, props?: InitialRemoteResourceProps<GameState, Def>): T;
    resourceDef: Def;
  }
): T[] {
  return (getModule(ctx, ResourceModule).resourcesByType.get(resourceClass.resourceDef.resourceType) || []) as T[];
}

export function ResourceLoaderSystem(ctx: GameState) {
  const { messageQueue } = getModule(ctx, ResourceModule);

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

export class RemoteNametag extends defineRemoteResourceClass(NametagResource) {}

export class RemoteSampler extends defineRemoteResourceClass(SamplerResource) {}

export class RemoteBuffer extends defineRemoteResourceClass(BufferResource) {}

export class RemoteBufferView extends defineRemoteResourceClass(BufferViewResource) {
  declare buffer: RemoteBuffer;
}

export class RemoteAudioData extends defineRemoteResourceClass(AudioDataResource) {
  declare bufferView: RemoteBufferView | undefined;
}

export class RemoteAudioSource extends defineRemoteResourceClass(AudioSourceResource) {
  declare audio: RemoteAudioData | undefined;
}

export class RemoteAudioEmitter extends defineRemoteResourceClass(AudioEmitterResource) {
  declare sources: RemoteAudioSource[];
}

export class RemoteImage extends defineRemoteResourceClass(ImageResource) {
  declare bufferView: RemoteBufferView | undefined;
}

export class RemoteTexture extends defineRemoteResourceClass(TextureResource) {
  declare sampler: RemoteSampler | undefined;
  declare source: RemoteImage;
}

export class RemoteReflectionProbe extends defineRemoteResourceClass(ReflectionProbeResource) {
  declare reflectionProbeTexture: RemoteTexture | undefined;
}

export class RemoteMaterial extends defineRemoteResourceClass(MaterialResource) {
  declare baseColorTexture: RemoteTexture | undefined;
  declare metallicRoughnessTexture: RemoteTexture | undefined;
  declare normalTexture: RemoteTexture | undefined;
  declare occlusionTexture: RemoteTexture | undefined;
  declare emissiveTexture: RemoteTexture | undefined;
  declare transmissionTexture: RemoteTexture | undefined;
  declare thicknessTexture: RemoteTexture | undefined;
}

export class RemoteLight extends defineRemoteResourceClass(LightResource) {}

export class RemoteCamera extends defineRemoteResourceClass(CameraResource) {}

export class RemoteSparseAccessor extends defineRemoteResourceClass(SparseAccessorResource) {
  declare indicesBufferView: RemoteBufferView;
  declare valuesBufferView: RemoteBufferView;
}

export class RemoteAccessor extends defineRemoteResourceClass(AccessorResource) {
  declare bufferView: RemoteBufferView | undefined;
  declare sparse: RemoteSparseAccessor | undefined;
}

export class RemoteMeshPrimitive extends defineRemoteResourceClass(MeshPrimitiveResource) {
  declare attributes: RemoteAccessor[];
  declare indices: RemoteAccessor | undefined;
  declare material: RemoteMaterial | undefined;
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

export class RemoteInteractable extends defineRemoteResourceClass(InteractableResource) {}

export class RemoteNode extends defineRemoteResourceClass(NodeResource) {
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
  dispose(ctx: GameState) {
    super.dispose(ctx);
    removeEntity(ctx.world, this.eid);
  }
}

export class RemoteAnimationSampler extends defineRemoteResourceClass(AnimationSamplerResource) {
  declare input: RemoteAccessor;
  declare output: RemoteAccessor;
}

export class RemoteAnimationChannel extends defineRemoteResourceClass(AnimationChannelResource) {
  declare sampler: RemoteAnimationSampler;
  declare targetNode: RemoteNode;
}

export class RemoteAnimation extends defineRemoteResourceClass(AnimationResource) {
  declare channels: RemoteAnimationChannel[];
  declare samplers: RemoteAnimationSampler[];
  declare clip: AnimationClip | undefined;
}

export class RemoteScene extends defineRemoteResourceClass(SceneResource) {
  declare backgroundTexture: RemoteTexture | undefined;
  declare reflectionProbe: RemoteReflectionProbe | undefined;
  declare audioEmitters: RemoteAudioEmitter[];
  declare firstNode: RemoteNode | undefined;
  dispose(ctx: GameState) {
    super.dispose(ctx);
    removeEntity(ctx.world, this.eid);
  }
}

export class RemoteEnvironment extends defineRemoteResourceClass(EnvironmentResource) {
  declare activeScene: RemoteScene | undefined;
  declare gltfResource: GLTFResource;
  dispose(ctx: GameState) {
    super.dispose(ctx);
    disposeGLTF(this.gltfResource);
  }
}

export class RemoteAvatar extends defineRemoteResourceClass(AvatarResource) {
  declare root: RemoteNode;
  declare gltfResource: GLTFResource;
}

export class RemoteWorld extends defineRemoteResourceClass(WorldResource) {
  declare environment: RemoteEnvironment | undefined;
  declare avatars: RemoteAvatar[];
  declare persistentScene: RemoteScene;
  declare transientScene: RemoteScene | undefined;
  declare activeCameraNode: RemoteNode | undefined;
}
