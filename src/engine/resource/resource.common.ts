import { NOOP } from "../config.common";
import { defineModule, Thread, registerMessageHandler, getModule, BaseThreadContext } from "../module/module.common";
import { createDeferred, Deferred } from "../utils/Deferred";

export type ResourceId = number;

export enum ResourceMessageType {
  InitResources = "init-resources",
  LoadResources = "load-resources",
  ResourceLoaded = "resource-loaded",
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

interface LocalResource<Resource = unknown> {
  id: number;
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
  resources: Map<ResourceId, LocalResource>;
  deferredResources: Map<ResourceId, Deferred<unknown>>;
  resourceLoaders: Map<string, ResourceLoader<ThreadContext, unknown, unknown>>;
}

export const createLocalResourceModule = <ThreadContext extends BaseThreadContext>() => {
  const ResourceModule = defineModule<ThreadContext, ResourceModuleState<ThreadContext>>({
    name: "resource",
    create() {
      return {
        resources: new Map(),
        deferredResources: new Map(),
        resourceLoaders: new Map(),
      };
    },
    init(ctx) {
      const dispose = registerMessageHandler(ctx, ResourceMessageType.LoadResources, onLoadResources);

      return () => {
        dispose();
      };
    },
  });

  function onLoadResources(ctx: ThreadContext, { resources }: LoadResourcesMessage) {
    const resourceModule = getModule(ctx, ResourceModule);

    for (const resource of resources) {
      loadResource(ctx, resourceModule, resource);
    }
  }

  async function loadResource(
    ctx: ThreadContext,
    resourceModule: ResourceModuleState<ThreadContext>,
    resourceMessage: any
  ) {
    const { id, resourceType, props, statusView } = resourceMessage;

    const resource: LocalResource = {
      id,
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

  function waitForLocalResource<Resource>(ctx: ThreadContext, resourceId: ResourceId): Promise<Resource> {
    if (resourceId === NOOP) {
      return Promise.reject(new Error(`Cannot load a resourceId of 0.`));
    }

    const resourceModule = getModule(ctx, ResourceModule);
    let deferred = resourceModule.deferredResources.get(resourceId);

    if (!deferred) {
      deferred = createDeferred<unknown>();
      resourceModule.deferredResources.set(resourceId, deferred);
    }

    return deferred.promise as Promise<Resource>;
  }

  function getLocalResource<Resource>(ctx: ThreadContext, resourceId: ResourceId): LocalResource<Resource> | undefined {
    const resourceModule = getModule(ctx, ResourceModule);
    return resourceModule.resources.get(resourceId) as LocalResource<Resource>;
  }

  return {
    ResourceModule,
    registerResourceLoader,
    waitForLocalResource,
    getLocalResource,
  };
};
