import { addComponent, addEntity, defineComponent } from "bitecs";

import { createObjectTripleBuffer } from "../allocator/ObjectBufferView";
import { removeAllEntityComponents } from "../ecs/removeAllEntityComponents";
import { GameState } from "../GameTypes";
import { defineModule, getModule, registerMessageHandler, Thread } from "../module/module.common";
import { createDisposables } from "../utils/createDisposables";
import { createDeferred, Deferred } from "../utils/Deferred";
import { createMessageQueueProducer } from "./MessageQueue";
import {
  RemoteNode,
  RemoteAudioData,
  RemoteAudioSource,
  RemoteAudioEmitter,
  RemoteNametag,
  RemoteLight,
  RemoteSampler,
  RemoteCamera,
  RemoteBuffer,
  RemoteBufferView,
  RemoteImage,
  RemoteMaterial,
  RemoteTexture,
  RemoteMesh,
  RemoteScene,
  RemoteMeshPrimitive,
  RemoteInteractable,
  RemoteAccessor,
  RemoteSparseAccessor,
  RemoteSkin,
  RemoteInstancedMesh,
  RemoteLightMap,
  RemoteReflectionProbe,
  RemoteTilesRenderer,
  RemoteAnimationChannel,
  RemoteAnimationSampler,
  RemoteAnimation,
  RemoteEnvironment,
  RemoteWorld,
} from "./RemoteResources";
import {
  ArrayBufferResourceType,
  CreateResourceMessage,
  fromGameResourceModuleStateSchema,
  FromGameResourceModuleStateTripleBuffer,
  InitGameResourceModuleMessage,
  InitRemoteResourceModuleMessage,
  ResourceDisposedError,
  ResourceId,
  ResourceLoadedMessage,
  ResourceMessageType,
  ResourceProps,
  StringResourceType,
  ToGameResourceModuleStateTripleBuffer,
} from "./resource.common";
import {
  InitialRemoteResourceProps,
  IRemoteResourceClass,
  IRemoteResourceManager,
  RemoteResource,
  ResourceDefinition,
} from "./ResourceDefinition";
import { ResourceType } from "./schema";
import { Pool, createPool, obtainFromPool } from "../utils/Pool";
import { Historian, createHistorian } from "../utils/Historian";
import { RecycleBin } from "../RecycleBin";
import {
  createResourceRingBuffer,
  ResourceRingBuffer,
  enqueueResourceRingBuffer,
  ResourceCommand,
} from "./DisposeResourceRingBuffer";

const ResourceComponent = defineComponent();

export interface ResourceTransformData {
  writeView: Uint8Array;
  refView: Uint32Array;
  refOffsets: number[];
  refIsString: boolean[];
  refIsBackRef: boolean[];
}

export interface ResourceModuleState {
  resourceInfos: Map<ResourceId, ResourceInfo>;
  resourcesByType: Map<ResourceType, RemoteResource<GameState>[]>;
  resourceConstructors: Map<ResourceDefinition, IRemoteResourceClass>;
  resourceTransformData: Map<number, ResourceTransformData>;
  resourceDefByType: Map<number, ResourceDefinition>;
  fromGameState: FromGameResourceModuleStateTripleBuffer;
  mainToGameState: ToGameResourceModuleStateTripleBuffer;
  renderToGameState: ToGameResourceModuleStateTripleBuffer;
  recycleBinPool: Pool<RecycleBin>;
  recycleBinHistorian: Historian<RecycleBin>;
  activeRecycleBin: RecycleBin;
  mainDisposedResources: ResourceRingBuffer;
  renderDisposedResources: ResourceRingBuffer;
}

type RemoteResourceTypes = string | ArrayBuffer | RemoteResource<GameState>;

interface ResourceInfo {
  resource: RemoteResourceTypes;
  refCount: number;
  deferred: Deferred<undefined>;
  dispose?: () => void;
}

const [queueResourceMessage, sendResourceMessages] = createMessageQueueProducer<GameState, CreateResourceMessage>(
  ResourceMessageType.LoadResources
);

export const ResourceModule = defineModule<GameState, ResourceModuleState>({
  name: "resource",
  async create(ctx: GameState, { sendMessage, waitForMessage }) {
    const fromGameState = createObjectTripleBuffer(
      fromGameResourceModuleStateSchema,
      ctx.gameToRenderTripleBufferFlags
    );

    const mainDisposedResources = createResourceRingBuffer();
    const renderDisposedResources = createResourceRingBuffer();

    sendMessage<InitGameResourceModuleMessage>(Thread.Main, ResourceMessageType.InitGameResourceModule, {
      fromGameState,
      toGameStateTripleBufferFlags: ctx.mainToGameTripleBufferFlags,
      disposedResources: mainDisposedResources,
    });

    sendMessage<InitGameResourceModuleMessage>(Thread.Render, ResourceMessageType.InitGameResourceModule, {
      fromGameState,
      toGameStateTripleBufferFlags: ctx.renderToGameTripleBufferFlags,
      disposedResources: renderDisposedResources,
    });

    const { toGameState: mainToGameState } = await waitForMessage<InitRemoteResourceModuleMessage>(
      Thread.Main,
      ResourceMessageType.InitRemoteResourceModule
    );

    const { toGameState: renderToGameState } = await waitForMessage<InitRemoteResourceModuleMessage>(
      Thread.Render,
      ResourceMessageType.InitRemoteResourceModule
    );

    const recycleBinPool = createPool<RecycleBin>(() => []);
    const recycleBinHistorian = createHistorian<RecycleBin>();

    return {
      resourceConstructors: new Map(),
      resourceTransformData: new Map(),
      resourceDefByType: new Map(),
      resourceInfos: new Map(),
      resourcesByType: new Map(),
      fromGameState,
      mainToGameState,
      renderToGameState,
      recycleBinPool,
      recycleBinHistorian,
      mainDisposedResources,
      renderDisposedResources,
      activeRecycleBin: obtainFromPool(recycleBinPool),
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
      registerResource(ctx, RemoteEnvironment),
      registerResource(ctx, RemoteWorld),
      registerMessageHandler(ctx, ResourceMessageType.ResourceLoaded, onResourceLoaded),
    ]);

    ctx.worldResource = new RemoteWorld(ctx.resourceManager, {
      persistentScene: new RemoteScene(ctx.resourceManager, {
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
  const refIsBackRef: boolean[] = [];

  const schema = resourceDef.schema;

  for (const propName in schema) {
    const prop = schema[propName];

    if (prop.type === "ref" || prop.type === "refArray" || prop.type === "refMap" || prop.type === "string") {
      for (let i = 0; i < prop.size; i++) {
        const refOffset = prop.byteOffset + i * prop.arrayType.BYTES_PER_ELEMENT;
        refOffsets.push(refOffset);
        refIsString.push(prop.type === "string");
        refIsBackRef.push(prop.backRef);
      }
    } else if (prop.type === "arrayBuffer") {
      refOffsets.push(prop.byteOffset + Uint32Array.BYTES_PER_ELEMENT);
      refIsString.push(false);
      refIsBackRef.push(prop.backRef);
    }
  }

  resourceModule.resourceTransformData.set(resourceDef.resourceType, {
    writeView,
    refView,
    refOffsets,
    refIsString,
    refIsBackRef,
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
  const id = addEntity(ctx.world);
  addComponent(ctx.world, ResourceComponent, id);

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
    deferred,
  });

  queueResourceMessage({
    resourceType,
    id,
    props,
  });

  enqueueResourceRingBuffer(resourceModule.mainDisposedResources, ResourceCommand.Create, ctx.tick, id);
  enqueueResourceRingBuffer(resourceModule.renderDisposedResources, ResourceCommand.Create, ctx.tick, id);

  return id;
}

export function createRemoteResource(ctx: GameState, resource: RemoteResource<GameState>): number {
  const resourceId = createResource(ctx, resource.constructor.resourceDef.name, resource.tripleBuffer, resource);

  addComponent(ctx.world, resource.constructor, resourceId);

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
  const resourceId = createResource(ctx, StringResourceType, value, value, dispose);
  addComponent(ctx.world, StringResourceType, resourceId);
  return resourceId;
}

export function createArrayBufferResource(ctx: GameState, value: SharedArrayBuffer): ResourceId {
  const resourceId = createResource(ctx, ArrayBufferResourceType, value, value);
  addComponent(ctx.world, ArrayBufferResourceType, resourceId);
  return resourceId;
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

  // removal all components from the entity so that all relevant exit queries are hit
  removeAllEntityComponents(ctx.world, resourceId);

  if (resourceInfo.dispose) {
    resourceInfo.dispose();
  }

  // queue up the tick this entity was disposed on
  enqueueResourceRingBuffer(resourceModule.mainDisposedResources, ResourceCommand.Dispose, ctx.tick, resourceId);
  enqueueResourceRingBuffer(resourceModule.renderDisposedResources, ResourceCommand.Dispose, ctx.tick, resourceId);

  // add entity to the frame-synchronized recycle bin
  resourceModule.activeRecycleBin.push(resourceId);

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

      resource.manager.removeResourceRefs(resourceId);
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

export function tryGetRemoteResource<Res>(ctx: GameState, resourceId: ResourceId): Res {
  const resource = getModule(ctx, ResourceModule).resourceInfos.get(resourceId)?.resource;

  if (!resource) {
    throw new Error(`Resource ${resourceId} not found`);
  }

  return resource as Res;
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

const MAX_RESOURCE_BATCH_SIZE = 512;

export function ResourceLoaderSystem(ctx: GameState) {
  sendResourceMessages(ctx, MAX_RESOURCE_BATCH_SIZE);
}
