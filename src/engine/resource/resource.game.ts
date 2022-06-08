import { GameState } from "../GameTypes";
import { defineModule, getModule, registerMessageHandler, Thread } from "../module/module.common";
import { createDeferred, Deferred } from "../utils/Deferred";
import {
  LoadResourceMessage,
  ResourceId,
  ResourceLoadedMessage,
  ResourceMessageType,
  ResourceProps,
  ResourceStatus,
} from "./resource.common";

interface RemoteResource {
  id: ResourceId;
  resourceType: string;
  props: ResourceProps;
  loaded: boolean;
  error?: string;
  statusView: Uint8Array;
}

interface ResourceModuleState {
  resourceIdCounter: number;
  resources: Map<ResourceId, RemoteResource>;
  resourceIdMap: Map<string, Map<any, ResourceId>>;
  deferredResources: Map<ResourceId, Deferred<undefined>>;
}

export const ResourceModule = defineModule<GameState, ResourceModuleState>({
  name: "resource",
  create() {
    return {
      resourceIdCounter: 0,
      resources: new Map(),
      resourceIdMap: new Map(),
      deferredResources: new Map(),
    };
  },
  init(ctx) {
    return registerMessageHandler(ctx, ResourceMessageType.ResourceLoaded, onResourceLoaded);
  },
});

function onResourceLoaded(ctx: GameState, { id, loaded, error }: ResourceLoadedMessage) {
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
    deferred.resolve(undefined);
  }
}

export function createResource<Props>(
  ctx: GameState,
  thread: Thread,
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

  const id = resourceModule.resourceIdCounter++;

  const statusBuffer = new SharedArrayBuffer(1);
  const statusView = new Uint8Array(statusBuffer);
  statusView[0] = ResourceStatus.Loading;

  resourceModule.resources.set(id, {
    id,
    resourceType,
    props,
    loaded: false,
    statusView,
  });

  if (cacheKey !== undefined) {
    resourceCache.set(cacheKey, id);
  }

  const deferred = createDeferred<undefined>();

  resourceModule.deferredResources.set(id, deferred);

  ctx.sendMessage<LoadResourceMessage<Props>>(
    thread,
    {
      type: ResourceMessageType.LoadResource,
      resourceType,
      id,
      props,
      statusView,
    },
    transferList
  );

  return id;
}

export function waitForRemoteResource(ctx: GameState, resourceId: ResourceId): Promise<undefined> {
  const resourceModule = getModule(ctx, ResourceModule);
  const deferred = resourceModule.deferredResources.get(resourceId);

  if (deferred) {
    return deferred.promise;
  }

  return Promise.reject(new Error(`Resource ${resourceId} not found.`));
}

export function getResourceStatus(ctx: GameState, resourceId: ResourceId): ResourceStatus {
  const resourceModule = getModule(ctx, ResourceModule);
  const resource = resourceModule.resources.get(resourceId);
  return resource ? resource.statusView[0] : ResourceStatus.None;
}
