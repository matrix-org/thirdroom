import { GameState } from "../GameTypes";
import { defineModule, getModule, registerMessageHandler, Thread } from "../module/module.common";
import { createDeferred, Deferred } from "../utils/Deferred";
import { IRefCounted } from "../utils/Disposable";
import {
  LoadResourcesMessage,
  ResourceDisposedError,
  ResourceDisposedMessage,
  ResourceId,
  ResourceLoadedMessage,
  ResourceMessageType,
  ResourceStatus,
} from "./resource.common";

interface ThreadResourceHandle {
  thread: Thread.Main | Thread.Render;
  loaded: boolean;
  error?: string;
  deferred?: Deferred<void>;
  statusView: Uint8Array;
}

interface ResourceModuleState {
  resourceIdCounter: number;
  resources: Map<ResourceId, Resource>;
  threadResources: Map<ResourceId, ThreadResourceHandle[]>;
  threadMessageQueues: {
    [Thread.Main]: any[];
    [Thread.Render]: any[];
  };
  threadTransferLists: {
    [Thread.Main]: Transferable[];
    [Thread.Render]: Transferable[];
  };
}

export abstract class Resource implements IRefCounted {
  public resourceId: ResourceId;
  public name: string;

  private refCount = 0;

  constructor(private ctx: GameState, public resourceType: string, name?: string) {
    this.name = name || resourceType;
    this.resourceId = createResource(ctx, this);
  }

  protected createThreadResource<T>(thread: Thread.Render | Thread.Main, props: T, transferList?: Transferable[]) {
    createThreadResource(this.ctx, this, thread, props, transferList);
  }

  promise(): Promise<this> {
    return waitForResource(this.ctx, this);
  }

  addRef() {
    this.refCount++;
  }

  protected onDisposed() {}

  release(): boolean {
    this.refCount--;

    if (this.refCount > 0) {
      return false;
    }

    disposeResource(this.ctx, this);

    this.onDisposed();

    return true;
  }
}

export const ResourceModule = defineModule<GameState, ResourceModuleState>({
  name: "resource",
  create() {
    return {
      resourceIdCounter: 1,
      resources: new Map(),
      threadResources: new Map(),
      threadMessageQueues: {
        [Thread.Main]: [],
        [Thread.Render]: [],
      },
      threadTransferLists: {
        [Thread.Main]: [],
        [Thread.Render]: [],
      },
    };
  },
  init(ctx) {
    return registerMessageHandler(ctx, ResourceMessageType.ResourceLoaded, onResourceLoaded);
  },
});

function onResourceLoaded(ctx: GameState, { id, thread, loaded, error }: ResourceLoadedMessage) {
  const resourceModule = getModule(ctx, ResourceModule);

  const threadResources = resourceModule.threadResources.get(id);

  if (!threadResources) {
    return;
  }

  for (let i = 0; i < threadResources.length; i++) {
    const threadResource = threadResources[i];

    if (threadResource.thread === thread) {
      threadResource.loaded = loaded;
      threadResource.error = error;

      if (threadResource.deferred) {
        if (error) {
          threadResource.deferred.reject(error);
        } else {
          threadResource.deferred.resolve();
        }
      }

      return;
    }
  }
}

function createResource(ctx: GameState, resource: Resource): ResourceId {
  const resourceModule = getModule(ctx, ResourceModule);
  const resourceId = resourceModule.resourceIdCounter++;
  resourceModule.resources.set(resourceId, resource);
  return resourceId;
}

function createThreadResource<Props>(
  ctx: GameState,
  resource: Resource,
  thread: Thread.Main | Thread.Render,
  props: Props,
  transferList?: Transferable[]
) {
  const resourceModule = getModule(ctx, ResourceModule);

  // First byte loading flag, second byte is dispose flag
  const statusBuffer = new SharedArrayBuffer(2);
  const statusView = new Uint8Array(statusBuffer);
  statusView[0] = ResourceStatus.Loading;

  resourceModule.threadMessageQueues[thread].push({
    resourceType: resource.resourceType,
    id: resource.resourceId,
    props,
    statusView,
  });

  if (transferList) {
    resourceModule.threadTransferLists[thread].push(...transferList);
  }

  let threadResources = resourceModule.threadResources.get(resource.resourceId);

  if (!threadResources) {
    threadResources = [];
    resourceModule.threadResources.set(resource.resourceId, threadResources);
  }

  threadResources.push({
    thread,
    statusView,
    loaded: false,
  });
}

function disposeResource(ctx: GameState, resource: Resource) {
  const resourceModule = getModule(ctx, ResourceModule);

  const threadResourceHandles = resourceModule.threadResources.get(resource.resourceId);

  if (threadResourceHandles) {
    for (let i = 0; i < threadResourceHandles.length; i++) {
      const threadResourceHandle = threadResourceHandles[i];

      threadResourceHandle.error = "Resource disposed";
      threadResourceHandle.loaded = true;

      if (threadResourceHandle.deferred) {
        threadResourceHandle.deferred.reject(new ResourceDisposedError("Resource disposed"));
      }

      // Set dispose flag
      threadResourceHandle.statusView[1] = 1;

      ctx.sendMessage<ResourceDisposedMessage>(threadResourceHandle.thread, {
        type: ResourceMessageType.ResourceDisposed,
        id: resource.resourceId,
      });
    }

    resourceModule.threadResources.delete(resource.resourceId);
  }

  resourceModule.resources.delete(resource.resourceId);
}

function waitForResource<R extends Resource>(ctx: GameState, resource: R): Promise<R> {
  const resourceModule = getModule(ctx, ResourceModule);

  const threadResourceHandles = resourceModule.threadResources.get(resource.resourceId);

  if (!threadResourceHandles) {
    return Promise.resolve(resource);
  }

  const promises: Promise<void>[] = [];

  for (const threadResourceHandle of threadResourceHandles) {
    if (threadResourceHandle.deferred) {
      promises.push(threadResourceHandle.deferred.promise);
    } else if (threadResourceHandle.error) {
      promises.push(Promise.reject(threadResourceHandle.error));
    } else if (threadResourceHandle.loaded) {
      promises.push(Promise.resolve());
    } else {
      const deferred = createDeferred<void>();
      threadResourceHandle.deferred = deferred;
      promises.push(deferred.promise);
    }
  }

  return Promise.all(promises).then(() => resource);
}

const threads: [Thread.Main, Thread.Render] = [Thread.Main, Thread.Render];

export function ResourceLoaderSystem(ctx: GameState) {
  const { threadMessageQueues, threadTransferLists } = getModule(ctx, ResourceModule);

  for (let i = 0; i < threads.length; i++) {
    const thread = threads[i];

    if (threadMessageQueues[thread].length !== 0) {
      ctx.sendMessage<LoadResourcesMessage>(
        thread,
        {
          type: ResourceMessageType.LoadResources,
          resources: threadMessageQueues[thread],
        },
        threadTransferLists[thread].length > 0 ? threadTransferLists[thread] : undefined
      );

      threadMessageQueues[thread] = [];

      if (threadTransferLists[thread].length > 0) {
        threadTransferLists[thread] = [];
      }
    }
  }
}
