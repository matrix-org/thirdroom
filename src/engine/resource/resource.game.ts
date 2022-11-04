import { GameState } from "../GameTypes";
import { defineModule, getModule, registerMessageHandler, Thread } from "../module/module.common";
import { createDeferred, Deferred } from "../utils/Deferred";
import {
  LoadResourcesMessage,
  ResourceDisposedError,
  ResourceDisposedMessage,
  ResourceId,
  ResourceLoadedMessage,
  ResourceMessageType,
  ResourceStatus,
} from "./resource.common";

interface RemoteResourceInfo {
  id: ResourceId;
  name: string;
  thread: Thread;
  resourceType: string;
  props: any;
  loaded: boolean;
  error?: string;
  statusView: Uint8Array;
  cacheKey?: string;
  refCount: number;
  dispose?: () => void;
}

interface ResourceModuleState {
  resourceIdCounter: number;
  resources: Map<ResourceId, any>;
  resourceInfos: Map<ResourceId, RemoteResourceInfo>;
  resourceIdMap: Map<string, Map<any, ResourceId>>;
  deferredResources: Map<ResourceId, Deferred<undefined>>;
  mainThreadMessageQueue: any[];
  renderThreadMessageQueue: any[];
  mainThreadTransferList: Transferable[];
  renderThreadTransferList: Transferable[];
}

export const ResourceModule = defineModule<GameState, ResourceModuleState>({
  name: "resource",
  create() {
    return {
      resourceIdCounter: 1,
      resources: new Map(),
      resourceInfos: new Map(),
      resourceIdMap: new Map(),
      deferredResources: new Map(),
      mainThreadMessageQueue: [],
      renderThreadMessageQueue: [],
      mainThreadTransferList: [],
      renderThreadTransferList: [],
    };
  },
  init(ctx) {
    return registerMessageHandler(ctx, ResourceMessageType.ResourceLoaded, onResourceLoaded);
  },
});

function onResourceLoaded(ctx: GameState, { id, loaded, error }: ResourceLoadedMessage) {
  const resourceModule = getModule(ctx, ResourceModule);

  const resourceInfo = resourceModule.resourceInfos.get(id);

  if (!resourceInfo) {
    return;
  }

  const deferred = resourceModule.deferredResources.get(id);

  if (!deferred) {
    return;
  }

  resourceInfo.loaded = loaded;
  resourceInfo.error = error;

  if (error) {
    deferred.reject(error);
  } else {
    deferred.resolve(undefined);
  }
}

interface ResourceOptions {
  name?: string;
  transferList?: Transferable[];
  cacheKey?: any;
  dispose?: () => void;
}

const UNKNOWN_RESOURCE_NAME = "Unknown Resource";

export function createResource<Props>(
  ctx: GameState,
  thread: Thread,
  resourceType: string,
  props: Props,
  options?: ResourceOptions
): number {
  const resourceModule = getModule(ctx, ResourceModule);

  let resourceCache = resourceModule.resourceIdMap.get(resourceType);

  if (resourceCache) {
    if (options?.cacheKey !== undefined) {
      const existingResourceId = resourceCache.get(options.cacheKey);

      if (existingResourceId !== undefined) {
        return existingResourceId;
      }
    }
  } else {
    resourceCache = new Map();
    resourceModule.resourceIdMap.set(resourceType, resourceCache);
  }

  const id = resourceModule.resourceIdCounter++;

  // First byte loading flag, second byte is dispose flag
  const statusBuffer = new SharedArrayBuffer(2);
  const statusView = new Uint8Array(statusBuffer);
  statusView[0] = ResourceStatus.Loading;

  const name = options?.name || UNKNOWN_RESOURCE_NAME;

  resourceModule.resourceInfos.set(id, {
    id,
    name,
    thread,
    resourceType,
    props,
    loaded: false,
    statusView,
    cacheKey: options?.cacheKey,
    refCount: 0,
    dispose: options?.dispose,
  });

  if (options?.cacheKey !== undefined) {
    resourceCache.set(options.cacheKey, id);
  }

  const deferred = createDeferred<undefined>();

  deferred.promise.catch((error) => {
    if (error instanceof ResourceDisposedError) {
      return;
    }

    console.error(error);
  });

  resourceModule.deferredResources.set(id, deferred);

  const message = {
    resourceType,
    id,
    name,
    props,
    statusView,
  };

  if (thread === Thread.Game) {
    throw new Error("Invalid resource thread target");
  }

  if (thread === Thread.Shared && options?.transferList) {
    throw new Error("Cannot transfer resources to multiple threads");
  }

  if (thread === Thread.Main || thread === Thread.Shared) {
    resourceModule.mainThreadMessageQueue.push(message);

    if (options?.transferList) {
      resourceModule.mainThreadTransferList.push(...options.transferList);
    }
  }

  if (thread === Thread.Render || thread === Thread.Shared) {
    resourceModule.renderThreadMessageQueue.push(message);

    if (options?.transferList) {
      resourceModule.renderThreadTransferList.push(...options.transferList);
    }
  }

  return id;
}

export function createStringResource(ctx: GameState, value: string): ResourceId {
  return createResource(ctx, Thread.Shared, "string", value);
}

export function disposeResource(ctx: GameState, resourceId: ResourceId): boolean {
  const resourceModule = getModule(ctx, ResourceModule);

  const resourceInfo = resourceModule.resourceInfos.get(resourceId);

  if (!resourceInfo) {
    return false;
  }

  resourceInfo.refCount--;

  if (resourceInfo.refCount > 0) {
    return false;
  }

  if (resourceInfo.dispose) {
    resourceInfo.dispose();
  }

  if (resourceInfo.cacheKey) {
    const resourceTypeCache = resourceModule.resourceIdMap.get(resourceInfo.resourceType);

    if (resourceTypeCache) {
      resourceTypeCache.delete(resourceInfo.cacheKey);
    }
  }

  const deferred = resourceModule.deferredResources.get(resourceId);

  if (deferred) {
    deferred.reject(new ResourceDisposedError("Resource disposed"));
    resourceModule.deferredResources.delete(resourceId);
  }

  // Set dispose flag
  resourceInfo.statusView[1] = 1;

  resourceModule.resourceInfos.delete(resourceId);

  const resource = resourceModule.resources.get(resourceId);

  if (resource && resource.dispose) {
    resource.dispose();
  }

  resourceModule.resources.delete(resourceId);

  if (resourceInfo.thread === Thread.Main || resourceInfo.thread === Thread.Shared) {
    ctx.sendMessage<ResourceDisposedMessage>(Thread.Main, {
      type: ResourceMessageType.ResourceDisposed,
      id: resourceId,
    });
  }

  if (resourceInfo.thread === Thread.Render || resourceInfo.thread === Thread.Shared) {
    ctx.sendMessage<ResourceDisposedMessage>(Thread.Render, {
      type: ResourceMessageType.ResourceDisposed,
      id: resourceId,
    });
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
  const resourceInfo = resourceModule.resourceInfos.get(resourceId);
  return resourceInfo ? resourceInfo.statusView[0] : ResourceStatus.None;
}

export function setRemoteResource<Res>(ctx: GameState, resourceId: ResourceId, resource: Res): void {
  getModule(ctx, ResourceModule).resources.set(resourceId, resource);
}

export function getRemoteResource<Res>(ctx: GameState, resourceId: ResourceId): Res | undefined {
  return getModule(ctx, ResourceModule).resources.get(resourceId) as Res | undefined;
}

export function ResourceLoaderSystem(ctx: GameState) {
  const resourceModule = getModule(ctx, ResourceModule);

  if (resourceModule.mainThreadMessageQueue.length !== 0) {
    ctx.sendMessage<LoadResourcesMessage>(
      Thread.Main,
      {
        type: ResourceMessageType.LoadResources,
        resources: resourceModule.mainThreadMessageQueue,
      },
      resourceModule.mainThreadTransferList.length > 0 ? resourceModule.mainThreadTransferList : undefined
    );

    resourceModule.mainThreadMessageQueue = [];

    if (resourceModule.mainThreadTransferList.length > 0) {
      resourceModule.mainThreadTransferList = [];
    }
  }

  if (resourceModule.renderThreadMessageQueue.length !== 0) {
    ctx.sendMessage<LoadResourcesMessage>(
      Thread.Render,
      {
        type: ResourceMessageType.LoadResources,
        resources: resourceModule.renderThreadMessageQueue,
      },
      resourceModule.renderThreadTransferList.length > 0 ? resourceModule.renderThreadTransferList : undefined
    );

    resourceModule.renderThreadMessageQueue = [];

    if (resourceModule.renderThreadTransferList.length > 0) {
      resourceModule.renderThreadTransferList = [];
    }
  }
}
