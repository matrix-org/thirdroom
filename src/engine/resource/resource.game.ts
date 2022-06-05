import { AtomicCounter, incrementCounter } from "../allocator/AtomicCounter";
import { GameState } from "../GameTypes";
import { defineModule, getModule, registerMessageHandler, Thread } from "../module/module.common";
import { createDeferred, Deferred } from "../utils/Deferred";
import {
  LoadResourceMessage,
  InitResourcesMessage,
  ResourceId,
  ResourceLoadedMessage,
  ResourceMessageType,
  ResourceProps,
} from "./resource.common";

interface RemoteResource<Response = unknown> {
  id: ResourceId;
  resourceType: string;
  props: ResourceProps;
  loaded: boolean;
  error?: string;
  response?: Response;
}

export type ResourceResponseHandler = <Response, Resource>(
  ctx: GameState,
  resourceId: ResourceId,
  response: Response
) => Resource;

interface ResourceModuleState {
  resourceIdCounter: AtomicCounter;
  resources: Map<ResourceId, RemoteResource>;
  resourceIdMap: Map<string, Map<any, ResourceId>>;
  deferredResources: Map<ResourceId, Deferred<unknown>>;
  resourceResponseHandlers: Map<string, ResourceResponseHandler>;
}

export const ResourceModule = defineModule<GameState, ResourceModuleState>({
  name: "resource",
  async create(ctx, { waitForMessage }) {
    const { resourceIdCounter } = await waitForMessage<InitResourcesMessage>(
      Thread.Render,
      ResourceMessageType.InitResources
    );

    return {
      resourceIdCounter,
      resources: new Map(),
      resourceIdMap: new Map(),
      deferredResources: new Map(),
      resourceResponseHandlers: new Map(),
    };
  },
  init(ctx) {
    return registerMessageHandler(ctx, ResourceMessageType.ResourceLoaded, onResourceLoaded);
  },
});

function onResourceLoaded(ctx: GameState, { id, loaded, response, error }: ResourceLoadedMessage) {
  const resourceModule = getModule(ctx, ResourceModule);

  const resource = resourceModule.resources.get(id);

  if (!resource) {
    return;
  }

  const deferred = resourceModule.deferredResources.get(id);

  if (!deferred) {
    return;
  }

  resource.loaded = loaded;
  resource.error = error;

  if (error) {
    deferred.reject(error);
  } else {
    const responseHandler = resourceModule.resourceResponseHandlers.get(resource.resourceType);

    if (responseHandler) {
      deferred.resolve(responseHandler(ctx, id, response));
    } else {
      deferred.resolve(undefined);
    }
  }
}

export function registerResourceResponseHandler(
  ctx: GameState,
  resourceType: string,
  responseHandler: ResourceResponseHandler
) {
  const resourceModule = getModule(ctx, ResourceModule);
  resourceModule.resourceResponseHandlers.set(resourceType, responseHandler);

  return () => {
    resourceModule.resourceResponseHandlers.delete(resourceType);
  };
}

export function createResource<Props>(
  ctx: GameState,
  resourceType: string,
  props: Props,
  transferList?: Transferable[],
  cacheKey?: any
): number {
  const resourceModule = getModule(ctx, ResourceModule);

  let resourceCache = resourceModule.resourceIdMap.get(resourceType);

  if (resourceCache) {
    if (cacheKey !== undefined) {
      const existingResourceId = resourceCache.get(cacheKey);

      if (existingResourceId !== undefined) {
        return existingResourceId;
      }
    }
  } else {
    resourceCache = new Map();
    resourceModule.resourceIdMap.set(resourceType, resourceCache);
  }

  const id = incrementCounter(resourceModule.resourceIdCounter);

  resourceModule.resources.set(id, {
    id,
    resourceType,
    props,
    loaded: false,
  });

  if (cacheKey !== undefined) {
    resourceCache.set(cacheKey, id);
  }

  const deferred = createDeferred<unknown>();

  resourceModule.deferredResources.set(id, deferred);

  ctx.sendMessage<LoadResourceMessage<Props>>(
    Thread.Render,
    {
      type: ResourceMessageType.LoadResource,
      resourceType,
      id,
      props,
    },
    transferList
  );

  return id;
}

export function waitForRemoteResource<Resource>(ctx: GameState, resourceId: ResourceId): Promise<Resource> {
  const resourceModule = getModule(ctx, ResourceModule);
  const deferred = resourceModule.deferredResources.get(resourceId);

  if (deferred) {
    return deferred.promise as Promise<Resource>;
  }

  return Promise.reject(new Error(`Resource ${resourceId} not found.`));
}

export function getRemoteResource<Response = unknown>(
  ctx: GameState,
  resourceId: ResourceId
): RemoteResource<Response> | undefined {
  const resourceModule = getModule(ctx, ResourceModule);
  return resourceModule.resources.get(resourceId) as RemoteResource<Response>;
}
