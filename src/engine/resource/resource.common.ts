import { getReadBufferIndex, getReadBufferIndexFromFlags, TripleBuffer } from "../allocator/TripleBuffer";
import { NOOP } from "../config.common";
import { defineModule, Thread, getModule, BaseThreadContext } from "../module/module.common";
import { createDisposables } from "../utils/createDisposables";
import { createDeferred, Deferred } from "../utils/Deferred";
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
  createObjectTripleBuffer,
  defineObjectBufferSchema,
  getReadObjectBufferView,
  getWriteObjectBufferView,
  ObjectTripleBuffer,
} from "../allocator/ObjectBufferView";
import { ResourceRingBuffer, drainResourceRingBuffer, ResourceCommand } from "./DisposeResourceRingBuffer";

export type ResourceId = number;

export const StringResourceType = "string";
export const ArrayBufferResourceType = "arrayBuffer";

export enum ResourceMessageType {
  InitGameResourceModule = "init-game-resource-module",
  InitRemoteResourceModule = "init-remote-resource-module",
  LoadResources = "load-resources",
  ResourceLoaded = "resource-loaded",
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
  props: ResourceProps;
}

export interface LoadResourcesMessage {
  type: ResourceMessageType.LoadResources;
  resources: CreateResourceMessage[];
}

export interface ResourceLoadedMessage<Response = unknown> {
  type: ResourceMessageType.ResourceLoaded;
  id: ResourceId;
  loaded: boolean;
  error?: string;
  response?: Response;
}

interface LocalResourceInfo {
  id: number;
  loaded: boolean;
  error?: string;
  resourceType: string;
  disposed: boolean;
}

export type RegisterResourceLoaderFunction<ThreadContext extends BaseThreadContext> = (
  ctx: ThreadContext,
  resourceType: string,
  resourceLoader: ResourceLoader<ThreadContext>
) => () => void;

export type ResourceLoader<ThreadContext extends BaseThreadContext> = (
  ctx: ThreadContext,
  id: ResourceId,
  props: ResourceProps
) => Promise<LocalResourceTypes>;

export type ResourceDefLoader<ThreadContext extends BaseThreadContext> = (
  ctx: ThreadContext,
  resource: LocalResource<ThreadContext>
) => Promise<LocalResource<ThreadContext>>;

interface ResourceModuleState<ThreadContext extends BaseThreadContext> {
  resources: Map<ResourceId, LocalResourceTypes>;
  resourceInfos: Map<ResourceId, LocalResourceInfo>;
  resourcesByType: Map<string, LocalResourceTypes[]>;
  deferredResources: Map<ResourceId, Deferred<unknown>>;
  resourceLoaders: Map<string, ResourceLoader<ThreadContext>>;
  fromGameState: FromGameResourceModuleStateTripleBuffer;
  toGameState: ToGameResourceModuleStateTripleBuffer;
  disposedResources: ResourceRingBuffer;
  createResourceMap: Map<ResourceId, number>;
  fromGameStateTripleBufferFlags: Uint8Array;
  resourceManager: ILocalResourceManager;
}

export class ResourceDisposedError extends Error {}

export const createLocalResourceModule = <ThreadContext extends BaseThreadContext>(
  resourceDefinitions: ILocalResourceConstructor<ThreadContext>[]
) => {
  const [drainResourceMessages, registerResourceMessageHandler] = createMessageQueueConsumer<
    ThreadContext,
    CreateResourceMessage
  >(ResourceMessageType.LoadResources);

  const ResourceModule = defineModule<ThreadContext, ResourceModuleState<ThreadContext>>({
    name: "resource",
    async create(ctx, { waitForMessage, sendMessage }) {
      const { fromGameStateTripleBufferFlags, fromGameState, toGameStateTripleBufferFlags, disposedResources } =
        await waitForMessage<InitGameResourceModuleMessage>(Thread.Game, ResourceMessageType.InitGameResourceModule);

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
        deferredResources: new Map(),
        resourceLoaders: new Map(),
        fromGameState,
        toGameState,
        disposedResources,
        createResourceMap: new Map(),
        fromGameStateTripleBufferFlags,
        resourceManager,
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
      loaded: false,
      resourceType,
      disposed: false,
    };

    resourceModule.resourceInfos.set(id, resourceInfo);

    let deferred = resourceModule.deferredResources.get(id);

    if (!deferred) {
      deferred = createDeferred<unknown>();
      resourceModule.deferredResources.set(id, deferred);
    }

    deferred.promise.catch((error) => {
      if (error instanceof ResourceDisposedError) {
        return;
      }

      console.error(error);
    });

    try {
      const resourceLoader = resourceModule.resourceLoaders.get(resourceType);

      if (!resourceLoader) {
        throw new Error(`No registered resource loader for ${resourceType}`);
      }

      resourceLoader(ctx, id, props).then((resource) => {
        if (resourceInfo.disposed) {
          if (typeof resource !== "string" && "dispose" in resource) {
            resource.dispose(ctx);
          }

          return;
        }

        resourceModule.resources.set(id, resource);
        resourceInfo.loaded = true;

        let resourceArr = resourceModule.resourcesByType.get(resourceType);

        if (!resourceArr) {
          resourceArr = [];
          resourceModule.resourcesByType.set(resourceType, resourceArr);
        }

        resourceArr.push(resource);

        deferred!.resolve(resource);
      });
    } catch (error) {
      console.error(`Error loading ${resourceType} ${id}:`, error);
      resourceInfo.error = error instanceof Error ? error.message : "Unknown error";
      deferred.reject(error);
    }

    ctx.sendMessage<ResourceLoadedMessage>(Thread.Game, {
      type: ResourceMessageType.ResourceLoaded,
      id,
      loaded: resourceInfo.loaded,
      error: resourceInfo.error,
    });
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

  function registerResource(ctx: ThreadContext, resourceDefOrClass: ILocalResourceConstructor<ThreadContext>) {
    const resourceModule = getModule(ctx, ResourceModule);

    const dependencyByteOffsets: number[] = [];
    const dependencyNames: string[] = [];

    const LocalResourceClass =
      "resourceDef" in resourceDefOrClass ? resourceDefOrClass : defineLocalResourceClass(resourceDefOrClass);

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
        dependencyByteOffsets.push(prop.byteOffset + Uint32Array.BYTES_PER_ELEMENT);
        dependencyNames.push(propName);
      }
    }

    function waitForLocalResourceDependencies(resource: LocalResource): Promise<void>[] {
      const promises: Promise<void>[] = [];
      const names: string[] = [];
      const bufferIndex = getReadBufferIndex(resource.tripleBuffer);
      const view = new Uint32Array(resource.tripleBuffer.buffers[bufferIndex]);

      for (let i = 0; i < dependencyByteOffsets.length; i++) {
        const index = dependencyByteOffsets[i] / Uint32Array.BYTES_PER_ELEMENT;
        const resourceId = view[index];
        const name = dependencyNames[i];

        if (resourceId) {
          names.push(name);
          promises.push(waitForLocalResource(ctx, resourceId, name));
        }
      }

      return promises;
    }

    async function loadLocalResource(
      ctx: ThreadContext,
      resourceId: number,
      tripleBuffer: ResourceProps
    ): Promise<LocalResource<ThreadContext>> {
      const resourceModule = getModule(ctx, ResourceModule);
      const resource = new LocalResourceClass(resourceModule.resourceManager, resourceId, tripleBuffer as TripleBuffer);
      await Promise.all(waitForLocalResourceDependencies(resource));
      await resource.load(ctx);
      return resource as LocalResource<ThreadContext>;
    }

    resourceModule.resourceLoaders.set(resourceDef.name, loadLocalResource);

    return () => {
      resourceModule.resourceLoaders.delete(resourceDef.name);
    };
  }

  function waitForLocalResource<Resource>(
    ctx: ThreadContext,
    resourceId: ResourceId,
    description?: string
  ): Promise<Resource> {
    if (resourceId === NOOP) {
      return Promise.reject(new Error(`Cannot load a resourceId of 0.`));
    }

    const resourceModule = getModule(ctx, ResourceModule);
    let deferred = resourceModule.deferredResources.get(resourceId);

    if (!deferred) {
      deferred = createDeferred<unknown>(30000, `Loading resource ${resourceId} ${description} timed out.`);
      resourceModule.deferredResources.set(resourceId, deferred);
    }

    return deferred.promise as Promise<Resource>;
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

  async function onLoadStringResource<ThreadContext extends BaseThreadContext>(
    ctx: ThreadContext,
    id: ResourceId,
    props: ResourceProps
  ): Promise<string> {
    return props as string;
  }

  async function onLoadArrayBufferResource<ThreadContext extends BaseThreadContext>(
    ctx: ThreadContext,
    id: ResourceId,
    props: ResourceProps
  ): Promise<SharedArrayBuffer> {
    return props as SharedArrayBuffer;
  }

  function ResourceLoaderSystem(ctx: ThreadContext) {
    const resourceModule = getModule(ctx, ResourceModule);
    const createResourceMap = resourceModule.createResourceMap;

    resourceModule.resourceManager.readBufferIndex = getReadBufferIndexFromFlags(
      resourceModule.fromGameStateTripleBufferFlags
    );

    const { tick } = getReadObjectBufferView(resourceModule.fromGameState);

    for (const [command, eid] of drainResourceRingBuffer(resourceModule.disposedResources, tick[0])) {
      const curCount = createResourceMap.get(eid) || 0;

      if (command === ResourceCommand.Create) {
        createResourceMap.set(eid, curCount + 1);
      } else if (command === ResourceCommand.Dispose) {
        disposeResource(ctx, resourceModule, eid);
        createResourceMap.set(eid, curCount - 1);
      }
    }

    for (const message of drainResourceMessages()) {
      const eid = message.id;
      const curCount = createResourceMap.get(eid) || 0;

      if (curCount === 1) {
        loadResource(ctx, resourceModule, message);
      }
    }

    const { lastProcessedTick } = getWriteObjectBufferView(resourceModule.toGameState);
    lastProcessedTick[0] = tick[0];
  }

  function disposeResource(ctx: ThreadContext, resourceModule: ResourceModuleState<ThreadContext>, resourceId: number) {
    const { deferredResources, resourceInfos, resources, resourcesByType } = resourceModule;

    const resourceInfo = resourceInfos.get(resourceId);

    if (resourceInfo) {
      const deferredResource = deferredResources.get(resourceId);

      if (deferredResource) {
        deferredResource.reject(new ResourceDisposedError("Resource disposed"));
        deferredResources.delete(resourceId);
      }

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

      resourceInfo.disposed = true;

      resourceInfos.delete(resourceId);

      return true;
    } else {
      return false;
    }
  }

  return {
    ResourceModule,
    registerResource,
    registerResourceLoader,
    waitForLocalResource,
    getLocalResource,
    getLocalResources,
    ResourceLoaderSystem,
  };
};
