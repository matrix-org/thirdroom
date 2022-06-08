import { defineModule, Thread, registerMessageHandler, getModule, BaseThreadContext } from "../module/module.common";
import { createDeferred, Deferred } from "../utils/Deferred";

export type ResourceId = number;

export enum ResourceMessageType {
  InitResources = "init-resources",
  LoadResource = "load-resource-2",
  ResourceLoaded = "resource-loaded-2",
}

export enum ResourceStatus {
  None,
  Loading,
  Loaded,
  Error,
}

export interface LoadResourceMessage<Props extends ResourceProps = ResourceProps> {
  type: ResourceMessageType.LoadResource;
  resourceType: string;
  id: ResourceId;
  props: Props;
  statusView: Uint8Array;
}

export interface ResourceLoadedMessage<Response = unknown> {
  type: ResourceMessageType.ResourceLoaded;
  id: ResourceId;
  loaded: boolean;
  error?: string;
  response?: Response;
}

export interface ResourceProps {
  name?: string;
}

interface LocalResource<Resource = unknown> {
  id: number;
  loaded: boolean;
  error?: string;
  resourceType: string;
  props: ResourceProps;
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
      const dispose = registerMessageHandler(ctx, ResourceMessageType.LoadResource, onLoadResource);

      return () => {
        dispose();
      };
    },
  });

  async function onLoadResource(ctx: ThreadContext, { id, resourceType, props, statusView }: LoadResourceMessage) {
    const resourceModule = getModule(ctx, ResourceModule);

    const resource: LocalResource = {
      id,
      loaded: false,
      resourceType,
      props,
      statusView,
    };

    resourceModule.resources.set(id, resource);

    const deferred = createDeferred<unknown>();

    resourceModule.deferredResources.set(id, deferred);

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
    const resourceModule = getModule(ctx, ResourceModule);
    const deferred = resourceModule.deferredResources.get(resourceId);

    if (deferred) {
      return deferred.promise as Promise<Resource>;
    }

    return Promise.reject(new Error(`Resource ${resourceId} not found.`));
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
