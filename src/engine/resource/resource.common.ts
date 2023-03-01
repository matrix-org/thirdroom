import { availableRead } from "@thirdroom/ringbuffer";

import { getReadBufferIndexFromFlags, TripleBuffer } from "../allocator/TripleBuffer";
import { defineModule, Thread, getModule, ConsumerThreadContext } from "../module/module.common";
import { createDisposables } from "../utils/createDisposables";
import {
  ILocalResourceManager,
  ResourceDefinition,
  LocalResourceTypes,
  ILocalResourceConstructor,
} from "./ResourceDefinition";
import { LocalResource } from "./ResourceDefinition";
import { defineLocalResourceClass } from "./LocalResourceClass";
import { createMessageQueueConsumer } from "./MessageQueue";
import {
  ResourceRingBuffer,
  enqueueResourceRingBuffer,
  dequeueResourceRingBuffer,
  ResourceRingBufferItem,
} from "./ResourceRingBuffer";
import {
  createObjectTripleBuffer,
  defineObjectBufferSchema,
  getReadObjectBufferView,
  getWriteObjectBufferView,
  ObjectTripleBuffer,
} from "../allocator/ObjectBufferView";

export enum LoadStatus {
  Uninitialized,
  Loading,
  Loaded,
  Error,
  Disposed,
}

export type ResourceId = number;

export const StringResourceType = "string";
export const ArrayBufferResourceType = "arrayBuffer";

export enum ResourceMessageType {
  InitGameResourceModule = "init-game-resource-module",
  InitRemoteResourceModule = "init-remote-resource-module",
  LoadResources = "load-resources",
}

export const fromGameResourceModuleStateSchema = defineObjectBufferSchema({
  tick: [Uint32Array, 1],
});

export const toGameResourceModuleStateSchema = defineObjectBufferSchema({
  lastProcessedTick: [Uint32Array, 1],
});

export type FromGameResourceModuleStateTripleBuffer = ObjectTripleBuffer<typeof fromGameResourceModuleStateSchema>;
export type ToGameResourceModuleStateTripleBuffer = ObjectTripleBuffer<typeof toGameResourceModuleStateSchema>;

export interface InitGameResourceModuleMessage {
  fromGameState: FromGameResourceModuleStateTripleBuffer;
  disposedResources: ResourceRingBuffer;
  recycleResources: ResourceRingBuffer;
  toGameStateTripleBufferFlags: Uint8Array;
  fromGameStateTripleBufferFlags: Uint8Array;
}

export interface InitRemoteResourceModuleMessage {
  toGameState: ToGameResourceModuleStateTripleBuffer;
}

export type ResourceProps = SharedArrayBuffer | string | TripleBuffer;

export interface CreateResourceMessage {
  resourceType: string;
  id: number;
  tick: number;
  props: ResourceProps;
}

export interface LoadResourcesMessage {
  type: ResourceMessageType.LoadResources;
  resources: CreateResourceMessage[];
}

interface LocalResourceInfo {
  id: number;
  resourceType: string;
  disposed: boolean;
}

export type RegisterResourceLoaderFunction<ThreadContext extends ConsumerThreadContext> = (
  ctx: ThreadContext,
  resourceType: string,
  resourceLoader: ResourceLoader<ThreadContext>
) => () => void;

export type ResourceLoader<ThreadContext extends ConsumerThreadContext> = (
  ctx: ThreadContext,
  id: ResourceId,
  props: ResourceProps
) => LocalResourceTypes;

interface ResourceModuleState<ThreadContext extends ConsumerThreadContext> {
  resources: Map<ResourceId, LocalResourceTypes>;
  resourceInfos: Map<ResourceId, LocalResourceInfo>;
  resourcesByType: Map<string, LocalResourceTypes[]>;
  resourceConstructors: ILocalResourceConstructor<ThreadContext>[];
  resourceLoaders: Map<string, ResourceLoader<ThreadContext>>;
  fromGameState: FromGameResourceModuleStateTripleBuffer;
  toGameState: ToGameResourceModuleStateTripleBuffer;
  disposedResources: ResourceRingBuffer;
  recycleResources: ResourceRingBuffer;
  recycleResourcesQueue: ResourceRingBufferItem[];
  pendingResourceDisposalsQueue: ResourceRingBufferItem[];
  lastProcessedTick: number;
  fromGameStateTripleBufferFlags: Uint8Array;
  resourceManager: ILocalResourceManager;
  createResourceMessages: CreateResourceMessage[];
}

export class ResourceDisposedError extends Error {}

export const createLocalResourceModule = <ThreadContext extends ConsumerThreadContext>(
  resourceDefinitions: ILocalResourceConstructor<ThreadContext>[]
) => {
  const [drainResourceMessages, registerResourceMessageHandler] = createMessageQueueConsumer<
    ThreadContext,
    CreateResourceMessage
  >(ResourceMessageType.LoadResources);

  const ResourceModule = defineModule<ThreadContext, ResourceModuleState<ThreadContext>>({
    name: "resource",
    async create(ctx, { waitForMessage, sendMessage }) {
      const {
        fromGameStateTripleBufferFlags,
        fromGameState,
        toGameStateTripleBufferFlags,
        disposedResources,
        recycleResources,
      } = await waitForMessage<InitGameResourceModuleMessage>(Thread.Game, ResourceMessageType.InitGameResourceModule);

      const toGameState = createObjectTripleBuffer(toGameResourceModuleStateSchema, toGameStateTripleBufferFlags);

      sendMessage<InitRemoteResourceModuleMessage>(Thread.Game, ResourceMessageType.InitRemoteResourceModule, {
        toGameState,
      });
      const resources = new Map();

      const resourceManager: ILocalResourceManager = {
        resources: resources,
        readBufferIndex: getReadBufferIndexFromFlags(fromGameStateTripleBufferFlags),
      };

      return {
        resources,
        resourceInfos: new Map(),
        resourcesByType: new Map(),
        resourceLoaders: new Map(),
        resourceConstructors: [],
        fromGameState,
        toGameState,
        disposedResources,
        recycleResources,
        recycleResourcesQueue: [],
        pendingResourceDisposalsQueue: [],
        lastProcessedTick: 0,
        fromGameStateTripleBufferFlags,
        resourceManager,
        createResourceMessages: [],
      };
    },
    init(ctx) {
      return createDisposables([
        ...resourceDefinitions.map((def) => registerResource(ctx, def)),
        registerResourceLoader(ctx, StringResourceType, onLoadStringResource),
        registerResourceLoader(ctx, ArrayBufferResourceType, onLoadArrayBufferResource),
        registerResourceMessageHandler(ctx),
      ]);
    },
  });

  function registerResource(ctx: ThreadContext, resourceDefOrClass: ILocalResourceConstructor<ThreadContext>) {
    const resourceModule = getModule(ctx, ResourceModule);

    const dependencyByteOffsets: number[] = [];
    const dependencyNames: string[] = [];

    const LocalResourceClass =
      "resourceDef" in resourceDefOrClass ? resourceDefOrClass : defineLocalResourceClass(resourceDefOrClass);

    resourceModule.resourceConstructors.push(LocalResourceClass);

    const resourceDef = LocalResourceClass.resourceDef;

    for (const propName in resourceDef.schema) {
      const prop = resourceDef.schema[propName];

      if (prop.backRef) {
        continue;
      }

      if (prop.type === "string" || prop.type === "ref" || prop.type === "refArray" || prop.type === "refMap") {
        for (let i = 0; i < prop.size; i++) {
          dependencyByteOffsets.push(prop.byteOffset + i * prop.arrayType.BYTES_PER_ELEMENT);
          dependencyNames.push(propName);
        }
      } else if (prop.type === "arrayBuffer") {
        dependencyByteOffsets.push(prop.byteOffset + Uint32Array.BYTES_PER_ELEMENT * 2);
        dependencyNames.push(propName);
      }
    }

    function loadLocalResource(
      ctx: ThreadContext,
      resourceId: number,
      tripleBuffer: ResourceProps
    ): LocalResource<ThreadContext> {
      const resourceModule = getModule(ctx, ResourceModule);
      const resource = new LocalResourceClass(resourceModule.resourceManager, resourceId, tripleBuffer as TripleBuffer);
      resource.load(ctx);
      return resource as LocalResource<ThreadContext>;
    }

    resourceModule.resourceLoaders.set(resourceDef.name, loadLocalResource);

    return () => {
      resourceModule.resourceLoaders.delete(resourceDef.name);
    };
  }

  function registerResourceLoader(
    ctx: ThreadContext,
    resourceType: string,
    resourceLoader: ResourceLoader<ThreadContext>
  ) {
    const resourceModule = getModule(ctx, ResourceModule);
    resourceModule.resourceLoaders.set(resourceType, resourceLoader);

    return () => {
      resourceModule.resourceLoaders.delete(resourceType);
    };
  }

  function onLoadStringResource<ThreadContext extends ConsumerThreadContext>(
    ctx: ThreadContext,
    id: ResourceId,
    props: ResourceProps
  ): string {
    return props as string;
  }

  function onLoadArrayBufferResource<ThreadContext extends ConsumerThreadContext>(
    ctx: ThreadContext,
    id: ResourceId,
    props: ResourceProps
  ): SharedArrayBuffer {
    return props as SharedArrayBuffer;
  }

  function ResourceLoaderSystem(ctx: ThreadContext) {
    const resourceModule = getModule(ctx, ResourceModule);

    resourceModule.resourceManager.readBufferIndex = getReadBufferIndexFromFlags(
      resourceModule.fromGameStateTripleBufferFlags
    );

    const {
      disposedResources,
      recycleResources,
      recycleResourcesQueue,
      pendingResourceDisposalsQueue,
      fromGameState,
      createResourceMessages,
    } = resourceModule;

    ctx.tick = getReadObjectBufferView(fromGameState).tick[0];

    // First go through the items in the disposed resources queue
    // and add them to the pending resource disposals queue
    while (availableRead(disposedResources)) {
      const item = dequeueResourceRingBuffer(disposedResources, { eid: 0, tick: 0 });
      pendingResourceDisposalsQueue.push(item);
    }

    // Then drain all of the messages postMessages containing create resource data
    for (const message of drainResourceMessages()) {
      createResourceMessages.push(message);
    }

    // First flush any pending resource disposals for this current frame.
    for (let i = 0; i < pendingResourceDisposalsQueue.length; i++) {
      const item = pendingResourceDisposalsQueue[i];

      /**
       * TODO: Current problem is that we're disposing the resource too early here.
       * So resources such as
       */

      // Dispose resources only when the current triple buffer view expects them to be disposed.
      if (item.tick <= ctx.tick && disposeResource(ctx, resourceModule, item.eid)) {
        //console.log(`${ctx.thread} dispose ${item.eid} tick ${ctx.tick}`);
        item.tick = ctx.tick;
        recycleResourcesQueue.push(item);
        pendingResourceDisposalsQueue.splice(i, 1);
        i--;
      } else {
        const createMessageIndex = createResourceMessages.findIndex((message) => message.id === item.eid);

        // Get rid of any create messages that are just going to be disposed
        if (createMessageIndex !== -1) {
          //console.log(`${ctx.thread} dispose ${item.eid} create message tick ${ctx.tick}`);
          createResourceMessages.splice(createMessageIndex, 1);
          item.tick = ctx.tick;
          recycleResourcesQueue.push(item);
          pendingResourceDisposalsQueue.splice(i, 1);
          i--;
        }
      }
    }

    for (let i = 0; i < createResourceMessages.length; i++) {
      const message = createResourceMessages[i];

      // Only process the loadResource message if it is in the current triple buffers.
      if (message.tick <= ctx.tick) {
        loadResource(ctx, resourceModule, message);
        //console.log(`${ctx.thread} create ${resourceInfo.resourceType} ${message.id} tick ${ctx.tick}`);
        createResourceMessages.splice(i, 1);
        i--;
      }
    }

    while (recycleResourcesQueue.length) {
      const item = recycleResourcesQueue.shift()!;
      //console.log(`${ctx.thread} recycle ${item.eid} tick ${ctx.tick}`);
      // The resource items returned back to the game thread
      enqueueResourceRingBuffer(recycleResources, item.eid, item.tick);
    }

    resourceModule.lastProcessedTick = ctx.tick;
  }

  // This system runs after the triple buffer is flipped. Ensuring that the tick
  function ReturnRecycledResourcesSystem(ctx: ThreadContext) {
    const { toGameState, lastProcessedTick } = getModule(ctx, ResourceModule);

    if (!ctx.isStaleFrame) {
      const toGame = getWriteObjectBufferView(toGameState);
      toGame.lastProcessedTick[0] = lastProcessedTick;
    }
  }

  function loadResource(
    ctx: ThreadContext,
    resourceModule: ResourceModuleState<ThreadContext>,
    resourceMessage: CreateResourceMessage
  ) {
    const { id, resourceType, props } = resourceMessage;

    if (resourceModule.resourceInfos.has(id)) {
      throw new Error(`Resource ${id} already exists`);
    }

    const resourceInfo: LocalResourceInfo = {
      id,
      resourceType,
      disposed: false,
    };

    resourceModule.resourceInfos.set(id, resourceInfo);

    const resourceLoader = resourceModule.resourceLoaders.get(resourceType);

    if (!resourceLoader) {
      throw new Error(`No registered resource loader for ${resourceType}`);
    }

    const resource = resourceLoader(ctx, id, props);

    resourceModule.resources.set(id, resource);

    let resourceArr = resourceModule.resourcesByType.get(resourceType);

    if (!resourceArr) {
      resourceArr = [];
      resourceModule.resourcesByType.set(resourceType, resourceArr);
    }

    resourceArr.push(resource);

    return resourceInfo;
  }

  function disposeResource(ctx: ThreadContext, resourceModule: ResourceModuleState<ThreadContext>, resourceId: number) {
    const { resourceInfos, resources, resourcesByType } = resourceModule;

    const resourceInfo = resourceInfos.get(resourceId);

    if (resourceInfo) {
      const resource = resources.get(resourceId);

      if (resource) {
        const resourceArr = resourcesByType.get(resourceInfo.resourceType);

        if (resourceArr) {
          const index = resourceArr.indexOf(resource);

          if (index !== -1) {
            resourceArr.splice(index, 1);
          }
        }

        if (typeof resource !== "string" && "dispose" in resource) {
          resource.dispose(ctx);
        }
      }

      resources.delete(resourceId);

      resourceInfo.disposed = true;

      resourceInfos.delete(resourceId);

      return true;
    } else {
      return false;
    }
  }

  function getLocalResource<Resource extends LocalResourceTypes>(
    ctx: ThreadContext,
    resourceId: ResourceId
  ): Resource | undefined {
    const resourceModule = getModule(ctx, ResourceModule);
    return resourceModule.resources.get(resourceId) as Resource | undefined;
  }

  function getLocalResources<Def extends ResourceDefinition, T extends LocalResource>(
    ctx: ThreadContext,
    resourceDefOrClass:
      | Def
      | { new (manager: ILocalResourceManager, resourceId: number, tripleBuffer: TripleBuffer): T; resourceDef: Def }
  ): T[] {
    const resourceModule = getModule(ctx, ResourceModule);
    const resourceDef = "resourceDef" in resourceDefOrClass ? resourceDefOrClass.resourceDef : resourceDefOrClass;
    return (resourceModule.resourcesByType.get(resourceDef.name) || []) as T[];
  }

  return {
    ResourceModule,
    registerResource,
    registerResourceLoader,
    getLocalResource,
    getLocalResources,
    ResourceLoaderSystem,
    ReturnRecycledResourcesSystem,
  };
};
