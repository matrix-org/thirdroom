import { getReadBufferIndex, TripleBuffer } from "../allocator/TripleBuffer";
import { NOOP } from "../config.common";
import { defineModule, Thread, registerMessageHandler, getModule, BaseThreadContext } from "../module/module.common";
import { createDisposables } from "../utils/createDisposables";
import { createDeferred, Deferred } from "../utils/Deferred";
import { ILocalResourceManager, ResourceDefinition } from "./ResourceDefinition";
import { LocalResource } from "./ResourceDefinition";
import { defineLocalResourceClass, ILocalResourceClass } from "./LocalResourceClass";

export type ResourceId = number;

export const StringResourceType = "string";
export const ArrayBufferResourceType = "arrayBuffer";

export enum ResourceMessageType {
  LoadResources = "load-resources",
  ResourceLoaded = "resource-loaded",
  ResourceDisposed = "resource-disposed",
}

export enum ResourceStatus {
  None,
  Loading,
  Loaded,
  Error,
}

export interface LoadResourcesMessage {
  type: ResourceMessageType.LoadResources;
  resources: {
    resourceType: string;
    id: ResourceId;
    name: string;
    props: any;
    statusView: Uint8Array;
  }[];
}

export interface ResourceLoadedMessage<Response = unknown> {
  type: ResourceMessageType.ResourceLoaded;
  id: ResourceId;
  loaded: boolean;
  error?: string;
  response?: Response;
}

export interface ResourceDisposedMessage {
  type: ResourceMessageType.ResourceDisposed;
  id: ResourceId;
}

interface LocalResourceInfo<Resource = unknown> {
  id: number;
  name: string;
  loaded: boolean;
  error?: string;
  resourceType: string;
  props: any;
  resource?: Resource;
  statusView: Uint8Array;
}

export type RegisterResourceLoaderFunction<ThreadContext extends BaseThreadContext> = (
  ctx: ThreadContext,
  resourceType: string,
  resourceLoader: ResourceLoader<ThreadContext, any, any>
) => () => void;

export type ResourceLoader<ThreadContext extends BaseThreadContext, Props, Resource> = (
  ctx: ThreadContext,
  id: ResourceId,
  props: Props
) => Promise<Resource>;

export type ResourceDefLoader<ThreadContext extends BaseThreadContext, Def extends ResourceDefinition> = (
  ctx: ThreadContext,
  resource: LocalResource<Def>
) => Promise<LocalResource<Def>>;

interface ResourceModuleState<ThreadContext extends BaseThreadContext> {
  disposedResources: ResourceId[];
  resourceInfos: Map<ResourceId, LocalResourceInfo>;
  resourcesByType: Map<string, any>;
  deferredResources: Map<ResourceId, Deferred<unknown>>;
  resourceLoaders: Map<string, ResourceLoader<ThreadContext, unknown, unknown>>;
}

export class ResourceDisposedError extends Error {}

export const createLocalResourceModule = <ThreadContext extends BaseThreadContext>() => {
  const ResourceModule = defineModule<ThreadContext, ResourceModuleState<ThreadContext>>({
    name: "resource",
    create() {
      return {
        disposedResources: [],
        resourceInfos: new Map(),
        resourcesByType: new Map(),
        deferredResources: new Map(),
        resourceLoaders: new Map(),
      };
    },
    init(ctx) {
      return createDisposables([
        registerMessageHandler(ctx, ResourceMessageType.LoadResources, onLoadResources),
        registerMessageHandler(ctx, ResourceMessageType.ResourceDisposed, onDisposeResource),
        registerResourceLoader(ctx, StringResourceType, onLoadStringResource),
        registerResourceLoader(ctx, ArrayBufferResourceType, onLoadArrayBufferResource),
      ]);
    },
  });

  function onLoadResources(ctx: ThreadContext, { resources }: LoadResourcesMessage) {
    const resourceModule = getModule(ctx, ResourceModule);

    for (const resource of resources) {
      loadResource(ctx, resourceModule, resource);
    }
  }

  function onDisposeResource(ctx: ThreadContext, { id }: ResourceDisposedMessage) {
    const resourceModule = getModule(ctx, ResourceModule);
    resourceModule.disposedResources.push(id);
  }

  async function loadResource(
    ctx: ThreadContext,
    resourceModule: ResourceModuleState<ThreadContext>,
    resourceMessage: any
  ) {
    const { id, name, resourceType, props, statusView } = resourceMessage;

    const resourceInfo: LocalResourceInfo = {
      id,
      name,
      loaded: false,
      resourceType,
      props,
      statusView,
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

      const resource = await resourceLoader(ctx, id, props);
      resourceInfo.resource = resource;
      resourceInfo.loaded = true;
      statusView[0] = ResourceStatus.Loaded;

      let resourceArr = resourceModule.resourcesByType.get(resourceType);

      if (!resourceArr) {
        resourceArr = [];
        resourceModule.resourcesByType.set(resourceType, resourceArr);
      }

      resourceArr.push(resource);

      deferred.resolve(resourceInfo.resource);
    } catch (error: any) {
      console.error(`Error loading ${resourceType} ${id}:`, error);
      resourceInfo.error = error.message || "Unknown error";
      statusView[0] = ResourceStatus.Error;
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
    resourceLoader: ResourceLoader<ThreadContext, any, any>
  ) {
    const resourceModule = getModule(ctx, ResourceModule);
    resourceModule.resourceLoaders.set(resourceType, resourceLoader);

    return () => {
      resourceModule.resourceLoaders.delete(resourceType);
    };
  }

  function registerResource<Def extends ResourceDefinition>(
    ctx: ThreadContext,
    resourceDefOrClass: Def | ILocalResourceClass<Def>
  ) {
    const resourceModule = getModule(ctx, ResourceModule);

    const dependencyByteOffsets: number[] = [];

    const manager: ILocalResourceManager = {
      getResource: <Def extends ResourceDefinition>(resourceDef: Def, resourceId: ResourceId) =>
        getLocalResource<Def>(ctx, resourceId)?.resource as LocalResource<Def> | undefined,
      getString: (resourceId: number): string => getLocalResource<string>(ctx, resourceId)?.resource || "",
      getArrayBuffer: (resourceId: number): SharedArrayBuffer | undefined =>
        getLocalResource<SharedArrayBuffer>(ctx, resourceId)?.resource,
    };

    const LocalResourceClass =
      "resourceDef" in resourceDefOrClass ? resourceDefOrClass : defineLocalResourceClass(resourceDefOrClass);

    const resourceDef = LocalResourceClass.resourceDef;

    for (const propName in resourceDef.schema) {
      const prop = resourceDef.schema[propName];

      if (prop.type === "string" || prop.type === "ref" || prop.type === "refArray" || prop.type === "refMap") {
        for (let i = 0; i < prop.size; i++) {
          dependencyByteOffsets.push(prop.byteOffset + i * prop.arrayType.BYTES_PER_ELEMENT);
        }
      } else if (prop.type === "arrayBuffer") {
        dependencyByteOffsets.push(prop.byteOffset + Uint32Array.BYTES_PER_ELEMENT);
      }
    }

    function waitForLocalResourceDependencies(resource: LocalResource<Def>): Promise<void>[] {
      const promises: Promise<void>[] = [];
      const bufferIndex = getReadBufferIndex(resource.tripleBuffer);
      const view = new Uint32Array(resource.tripleBuffer.buffers[bufferIndex]);

      for (let i = 0; i < dependencyByteOffsets.length; i++) {
        const index = dependencyByteOffsets[i] / Uint32Array.BYTES_PER_ELEMENT;
        const resourceId = view[index];

        if (resourceId) {
          promises.push(waitForLocalResource(ctx, resourceId));
        }
      }

      return promises;
    }

    async function loadLocalResource(ctx: ThreadContext, resourceId: number, tripleBuffer: TripleBuffer) {
      const resource = new LocalResourceClass(manager, resourceId, tripleBuffer);
      await Promise.all(waitForLocalResourceDependencies(resource));
      await resource.load(ctx);
      return resource;
    }

    resourceModule.resourceLoaders.set(
      resourceDef.name,
      loadLocalResource as ResourceLoader<ThreadContext, unknown, unknown>
    );

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

  function getLocalResource<Resource>(
    ctx: ThreadContext,
    resourceId: ResourceId
  ): LocalResourceInfo<Resource> | undefined {
    const resourceModule = getModule(ctx, ResourceModule);
    return resourceModule.resourceInfos.get(resourceId) as LocalResourceInfo<Resource>;
  }

  function getLocalResources<
    DefOrClass extends ResourceDefinition<{}> | ILocalResourceClass<ResourceDefinition<{}>, ThreadContext>
  >(
    ctx: ThreadContext,
    resourceDefOrClass: DefOrClass
  ): DefOrClass extends ResourceDefinition
    ? LocalResource<DefOrClass, ThreadContext>[]
    : DefOrClass extends ILocalResourceClass<ResourceDefinition<{}>, ThreadContext>
    ? InstanceType<DefOrClass>[]
    : never {
    const resourceModule = getModule(ctx, ResourceModule);
    const resourceDef = "resourceDef" in resourceDefOrClass ? resourceDefOrClass.resourceDef : resourceDefOrClass;
    return resourceModule.resourcesByType.get(resourceDef.name) || [];
  }

  function getResourceDisposed(ctx: ThreadContext, resourceId: ResourceId): ResourceStatus {
    const resourceModule = getModule(ctx, ResourceModule);
    const resource = resourceModule.resourceInfos.get(resourceId);
    return resource ? resource.statusView[1] : ResourceStatus.None;
  }

  async function onLoadStringResource<ThreadContext extends BaseThreadContext>(
    ctx: ThreadContext,
    id: ResourceId,
    value: string
  ): Promise<string> {
    return value;
  }

  async function onLoadArrayBufferResource<ThreadContext extends BaseThreadContext>(
    ctx: ThreadContext,
    id: ResourceId,
    value: SharedArrayBuffer
  ): Promise<SharedArrayBuffer> {
    return value;
  }

  function ResourceDisposalSystem(ctx: ThreadContext) {
    const { disposedResources, deferredResources, resourceInfos, resourcesByType } = getModule(ctx, ResourceModule);

    for (let i = disposedResources.length - 1; i >= 0; i--) {
      const resourceId = disposedResources[i];
      const resourceInfo = resourceInfos.get(resourceId);

      if (resourceInfo) {
        const deferredResource = deferredResources.get(resourceId);

        if (deferredResource) {
          deferredResource.reject(new ResourceDisposedError("Resource disposed"));
          deferredResources.delete(resourceId);
        }

        if (resourceInfo.resource) {
          const resourceArr = resourcesByType.get(resourceInfo.resourceType);

          if (resourceArr) {
            const index = resourceArr.indexOf(resourceInfo.resource);

            if (index !== -1) {
              resourceArr.splice(index, 1);
            }
          }

          if ((resourceInfo.resource as LocalResource<ResourceDefinition>).dispose) {
            (resourceInfo.resource as LocalResource<ResourceDefinition>).dispose(ctx);
          }
        }

        resourceInfos.delete(resourceId);

        disposedResources.splice(i, 1);
      }
    }
  }

  return {
    ResourceModule,
    registerResource,
    registerResourceLoader,
    waitForLocalResource,
    getLocalResource,
    getLocalResources,
    getResourceDisposed,
    ResourceDisposalSystem,
  };
};
