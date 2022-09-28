import { NOOP } from "../config.common";
import { defineModule, Thread, registerMessageHandler, getModule, BaseThreadContext } from "../module/module.common";
import { createDisposables } from "../utils/createDisposables";
import { createDeferred, Deferred } from "../utils/Deferred";

export type ResourceId = number;

export enum ResourceMessageType {
  InitResources = "init-resources",
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

interface LocalResource<Resource = unknown> {
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

interface ResourceModuleState<ThreadContext extends BaseThreadContext> {
  disposedResources: ResourceId[];
  resources: Map<ResourceId, LocalResource>;
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
        resources: new Map(),
        deferredResources: new Map(),
        resourceLoaders: new Map(),
      };
    },
    init(ctx) {
      return createDisposables([
        registerMessageHandler(ctx, ResourceMessageType.LoadResources, onLoadResources),
        registerMessageHandler(ctx, ResourceMessageType.ResourceDisposed, onDisposeResource),
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

    const resource: LocalResource = {
      id,
      name,
      loaded: false,
      resourceType,
      props,
      statusView,
    };

    resourceModule.resources.set(id, resource);

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

      const result = await resourceLoader(ctx, id, props);
      resource.resource = result;
      resource.loaded = true;
      statusView[0] = ResourceStatus.Loaded;

      deferred.resolve(resource.resource);
    } catch (error: any) {
      console.error(`Error loading ${resourceType} ${id}:`, error);
      resource.error = error.message || "Unknown error";
      statusView[0] = ResourceStatus.Error;
      deferred.reject(error);
    }

    ctx.sendMessage<ResourceLoadedMessage>(Thread.Game, {
      type: ResourceMessageType.ResourceLoaded,
      id,
      loaded: resource.loaded,
      error: resource.error,
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

  function getLocalResource<Resource>(ctx: ThreadContext, resourceId: ResourceId): LocalResource<Resource> | undefined {
    const resourceModule = getModule(ctx, ResourceModule);
    return resourceModule.resources.get(resourceId) as LocalResource<Resource>;
  }

  function getResourceDisposed(ctx: ThreadContext, resourceId: ResourceId): ResourceStatus {
    const resourceModule = getModule(ctx, ResourceModule);
    const resource = resourceModule.resources.get(resourceId);
    return resource ? resource.statusView[1] : ResourceStatus.None;
  }

  function ResourceDisposalSystem(ctx: ThreadContext) {
    const { disposedResources, deferredResources, resources } = getModule(ctx, ResourceModule);

    for (let i = disposedResources.length - 1; i >= 0; i--) {
      const resourceId = disposedResources[i];

      if (resources.has(resourceId)) {
        const deferredResource = deferredResources.get(resourceId);

        if (deferredResource) {
          deferredResource.reject(new ResourceDisposedError("Resource disposed"));
          deferredResources.delete(resourceId);
        }

        resources.delete(resourceId);

        disposedResources.splice(i, 1);
      }
    }
  }

  return {
    ResourceModule,
    registerResourceLoader,
    waitForLocalResource,
    getLocalResource,
    getResourceDisposed,
    ResourceDisposalSystem,
  };
};
