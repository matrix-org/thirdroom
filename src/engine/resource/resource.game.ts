import { addComponent, addEntity, defineComponent, removeEntity } from "bitecs";
import { availableRead } from "@thirdroom/ringbuffer";

import {
  createObjectTripleBuffer,
  getReadObjectBufferView,
  getWriteObjectBufferView,
} from "../allocator/ObjectBufferView";
import { removeAllEntityComponents } from "../ecs/removeAllEntityComponents";
import { GameState, RemoteResourceManager } from "../GameTypes";
import { defineModule, getModule, Thread } from "../module/module.common";
import { createDisposables } from "../utils/createDisposables";
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
  ResourceId,
  ResourceMessageType,
  ResourceProps,
  StringResourceType,
  ToGameResourceModuleStateTripleBuffer,
} from "./resource.common";
import { ResourceDefinition } from "./ResourceDefinition";
import { ResourceType } from "./schema";
import {
  createResourceRingBuffer,
  ResourceRingBuffer,
  enqueueResourceRingBuffer,
  dequeueResourceRingBuffer,
  ResourceRingBufferItem,
} from "./ResourceRingBuffer";
import { IRemoteResourceClass, RemoteResource } from "./RemoteResourceClass";

const ResourceComponent = defineComponent();

export interface ResourceTransformData {
  writeView: Uint8Array;
  refView: Uint32Array;
  refOffsets: number[];
  refIsString: boolean[];
  refIsBackRef: boolean[];
}

export type RemoteResourceTypes = string | ArrayBuffer | RemoteResource;

export interface ResourceModuleState {
  resources: RemoteResource[];
  resourceMap: Map<number, RemoteResourceTypes>;
  resourceInfos: Map<ResourceId, ResourceInfo>;
  resourcesByType: Map<ResourceType, RemoteResource[]>;
  resourceDefByType: Map<number, ResourceDefinition>;
  fromGameState: FromGameResourceModuleStateTripleBuffer;
  mainToGameState: ToGameResourceModuleStateTripleBuffer;
  renderToGameState: ToGameResourceModuleStateTripleBuffer;
  mainDisposedResources: ResourceRingBuffer;
  renderDisposedResources: ResourceRingBuffer;
  mainRecycleResources: ResourceRingBuffer;
  renderRecycleResources: ResourceRingBuffer;
  disposedResourcesQueue: number[];
  disposeRefCounts: Map<number, number>;
  deferredRemovals: ResourceRingBufferItem[];
}

interface ResourceInfo {
  refCount: number;
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
    const mainRecycleResources = createResourceRingBuffer();
    const renderRecycleResources = createResourceRingBuffer();

    sendMessage<InitGameResourceModuleMessage>(Thread.Main, ResourceMessageType.InitGameResourceModule, {
      fromGameState,
      toGameStateTripleBufferFlags: ctx.mainToGameTripleBufferFlags,
      // All resource use gameToRenderTripleBufferFlags. Unsure if this could cause a race since there is
      // synchronization between render/main with requestAnimationFrame
      fromGameStateTripleBufferFlags: ctx.gameToRenderTripleBufferFlags,
      disposedResources: mainDisposedResources,
      recycleResources: mainRecycleResources,
    });

    sendMessage<InitGameResourceModuleMessage>(Thread.Render, ResourceMessageType.InitGameResourceModule, {
      fromGameState,
      toGameStateTripleBufferFlags: ctx.renderToGameTripleBufferFlags,
      fromGameStateTripleBufferFlags: ctx.gameToRenderTripleBufferFlags,
      disposedResources: renderDisposedResources,
      recycleResources: renderRecycleResources,
    });

    const { toGameState: mainToGameState } = await waitForMessage<InitRemoteResourceModuleMessage>(
      Thread.Main,
      ResourceMessageType.InitRemoteResourceModule
    );

    const { toGameState: renderToGameState } = await waitForMessage<InitRemoteResourceModuleMessage>(
      Thread.Render,
      ResourceMessageType.InitRemoteResourceModule
    );

    return {
      resourceDefByType: new Map(),
      resources: [],
      resourceInfos: new Map(),
      resourceMap: new Map(),
      resourcesByType: new Map(),
      fromGameState,
      mainToGameState,
      renderToGameState,
      mainDisposedResources,
      renderDisposedResources,
      mainRecycleResources,
      renderRecycleResources,
      disposedResourcesQueue: [],
      disposeRefCounts: new Map(),
      deferredRemovals: [],
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
    ]);

    ctx.resourceManager = createRemoteResourceManager(ctx);

    ctx.worldResource = new RemoteWorld(ctx.resourceManager, {
      persistentScene: new RemoteScene(ctx.resourceManager, {
        name: "Persistent Scene",
      }),
    });

    return dispose;
  },
});

export function createRemoteResourceManager(ctx: GameState): RemoteResourceManager {
  const resourceModule = getModule(ctx, ResourceModule);

  return {
    ctx,
    resourceIds: new Set(),
    gltfCache: new Map(),
    resourceMap: resourceModule.resourceMap,
  };
}

function registerResource<Def extends ResourceDefinition>(
  ctx: GameState,
  resourceDefOrClass: IRemoteResourceClass<Def>
) {
  const resourceModule = getModule(ctx, ResourceModule);

  const RemoteResourceClass = resourceDefOrClass;

  const resourceDef = RemoteResourceClass.resourceDef;

  resourceModule.resourceDefByType.set(resourceDef.resourceType, resourceDef);

  return () => {};
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

  resourceModule.resourceInfos.set(id, {
    refCount: 0,
    dispose,
  });

  resourceModule.resourceMap.set(id, resource);

  queueResourceMessage({
    resourceType,
    id,
    tick: ctx.tick,
    props,
  });

  return id;
}

export function createRemoteResource(ctx: GameState, resource: RemoteResource): number {
  const resourceId = createResource(ctx, resource.constructor.resourceDef.name, resource.tripleBuffer, resource);

  addComponent(ctx.world, resource.constructor, resourceId);

  const { resourcesByType, resources } = getModule(ctx, ResourceModule);

  const resourceType = resource.resourceType;
  let resourceArr = resourcesByType.get(resourceType);

  if (!resourceArr) {
    resourceArr = [];
    resourcesByType.set(resourceType, resourceArr);
  }

  resourceArr.push(resource as unknown as RemoteResource);

  resources.push(resource);

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

  resourceModule.disposedResourcesQueue.push(resourceId);

  resourceModule.resourceInfos.delete(resourceId);

  const resource = resourceModule.resourceMap.get(resourceId) as RemoteResourceTypes;

  resourceModule.resourceMap.delete(resourceId);

  if (typeof resource !== "string" && "resourceType" in resource) {
    const resourceType = resource.resourceType;

    const resourceIndex = resourceModule.resources.indexOf(resource);

    if (resourceIndex !== -1) {
      resourceModule.resources.splice(resourceIndex, 1);
    }

    const resourceArr = resourceModule.resourcesByType.get(resourceType);

    if (resourceArr) {
      const index = resourceArr.indexOf(resource);

      if (index !== -1) {
        resourceArr.splice(index, 1);
      }
    }

    resource.removeResourceRefs();
  }

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
  const resource = getModule(ctx, ResourceModule).resourceMap.get(resourceId);

  if (!resource) {
    throw new Error(`Resource ${resourceId} not found`);
  }

  return resource as Res;
}

export function getRemoteResource<Res>(ctx: GameState, resourceId: ResourceId): Res | undefined {
  return getModule(ctx, ResourceModule).resourceMap.get(resourceId) as Res | undefined;
}

export function getRemoteResources<Def extends ResourceDefinition>(
  ctx: GameState,
  resourceClass: IRemoteResourceClass<Def>
): InstanceType<IRemoteResourceClass<Def>>[] {
  return (getModule(ctx, ResourceModule).resourcesByType.get(resourceClass.resourceDef.resourceType) ||
    []) as InstanceType<IRemoteResourceClass<Def>>[];
}

export function ResourceTickSystem(ctx: GameState) {
  const { fromGameState } = getModule(ctx, ResourceModule);
  const { tick } = getWriteObjectBufferView(fromGameState);
  // Tell Main/Render threads what the game thread's tick is
  tick[0] = ctx.tick;
}

export function ResourceLoaderSystem(ctx: GameState) {
  sendResourceMessages(ctx);
}

export function ResourceDisposalSystem(ctx: GameState) {
  const { disposedResourcesQueue, mainDisposedResources, renderDisposedResources, disposeRefCounts } = getModule(
    ctx,
    ResourceModule
  );

  while (disposedResourcesQueue.length) {
    const eid = disposedResourcesQueue.shift()!;

    if (disposeRefCounts.has(eid)) {
      throw new Error("Disposed resource already has ref counts");
    }

    disposeRefCounts.set(eid, 2);

    //console.log(`${ctx.thread} enqueue disposal ${eid} tick ${ctx.tick}`);

    enqueueResourceRingBuffer(mainDisposedResources, eid, ctx.tick);
    enqueueResourceRingBuffer(renderDisposedResources, eid, ctx.tick);
  }
}

function processResourceRingBuffer(
  resourceRingBuffer: ResourceRingBuffer,
  disposeRefCounts: Map<number, number>,
  deferredRemovals: ResourceRingBufferItem[]
) {
  while (availableRead(resourceRingBuffer)) {
    const item = dequeueResourceRingBuffer(resourceRingBuffer, { eid: 0, tick: 0 });

    let refCount = disposeRefCounts.get(item.eid);

    if (refCount === undefined) {
      throw new Error("Tried to dispose entity which has no dispose ref counts");
    }

    if (--refCount === 0) {
      deferredRemovals.push(item);
    } else {
      disposeRefCounts.set(item.eid, refCount);
    }
  }
}

export function RecycleResourcesSystem(ctx: GameState) {
  const {
    mainRecycleResources,
    renderRecycleResources,
    disposeRefCounts,
    deferredRemovals,
    mainToGameState,
    renderToGameState,
  } = getModule(ctx, ResourceModule);

  const { lastProcessedTick: lastProcessedTickMain } = getReadObjectBufferView(mainToGameState);
  const { lastProcessedTick: lastProcessedTickRender } = getReadObjectBufferView(renderToGameState);

  // What is the last fully processed tick for both the main and render thread?
  const lastProcessedTick = Math.min(lastProcessedTickMain[0], lastProcessedTickRender[0]);

  // Dequeue items representing resources being disposed on a specified tick on each of the following threads
  // Decrement a ref count for a particular resource from 2 to 0 representing how many threads it is waiting on
  // to be removed.
  // If the ref count reaches 0 then we know that the resource has been properly disposed on both threads.
  processResourceRingBuffer(mainRecycleResources, disposeRefCounts, deferredRemovals);
  processResourceRingBuffer(renderRecycleResources, disposeRefCounts, deferredRemovals);

  for (let i = 0; i < deferredRemovals.length; i++) {
    const item = deferredRemovals[i];

    if (item.tick <= lastProcessedTick && ctx.tick > lastProcessedTick) {
      //console.log(`${ctx.thread} dispose ${item.eid} tick ${ctx.tick}`);
      disposeRefCounts.delete(item.eid);
      removeEntity(ctx.world, item.eid);
      deferredRemovals.splice(i, 1);
      i--;
    }
    // } else {
    //   console.log(`eid ${item.eid} tick is greater than the last processed tick. Deferring.`);
    // }
  }
}
