import { AtomicCounter, createAtomicCounter } from "../allocator/AtomicCounter";
import { defineModule, Thread, registerMessageHandler, getModule } from "../module/module.common";
import { RenderThreadState } from "../renderer/renderer.render";
import { createDeferred, Deferred } from "../utils/Deferred";
import {
  InitResourcesMessage,
  ResourceId,
  ResourceMessageType,
  ResourceProps,
  LoadResourceMessage,
  ResourceLoadedMessage,
} from "./resource.common";

interface LocalResource<Resource = unknown> {
  id: number;
  loaded: boolean;
  error?: string;
  resourceType: string;
  props: ResourceProps;
  resource?: Resource;
}

export type ResourceLoader<Props, Resource, Response> = (
  ctx: RenderThreadState,
  id: ResourceId,
  props: Props
) => Promise<Resource | [Resource, Response] | [Resource, Response, Transferable[]]>;

interface ResourceModuleState {
  resourceIdCounter: AtomicCounter;
  resources: Map<ResourceId, LocalResource>;
  deferredResources: Map<ResourceId, Deferred<unknown>>;
  resourceLoaders: Map<string, ResourceLoader<unknown, unknown, unknown>>;
}

export const ResourceModule = defineModule<RenderThreadState, ResourceModuleState>({
  name: "resource",
  create(ctx, { sendMessage }) {
    const resourceIdCounter = createAtomicCounter(1);

    sendMessage<InitResourcesMessage>(Thread.Game, ResourceMessageType.InitResources, { resourceIdCounter });

    return {
      resourceIdCounter,
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

async function onLoadResource(ctx: RenderThreadState, { id, resourceType, props }: LoadResourceMessage) {
  const resourceModule = getModule(ctx, ResourceModule);

  const resource: LocalResource = {
    id,
    loaded: false,
    resourceType,
    props,
  };

  resourceModule.resources.set(id, resource);

  const deferred = createDeferred<unknown>();

  resourceModule.deferredResources.set(id, deferred);

  let response: unknown;
  let transferList: Transferable[] | undefined;

  try {
    const resourceLoader = resourceModule.resourceLoaders.get(resourceType);

    if (!resourceLoader) {
      throw new Error(`No registered resource loader for ${resourceType}`);
    }

    const result = await resourceLoader(ctx, id, props);

    if (Array.isArray(result)) {
      resource.resource = result[0];
      response = result[1];
      transferList = result[2];
    } else {
      resource.resource = result;
    }

    resource.loaded = true;

    deferred.resolve(resource.resource);
  } catch (error: any) {
    console.error(`Error loading ${resourceType} ${id}:`, error);
    resource.error = error.message || "Unknown error";
    deferred.reject(error);
  }

  ctx.sendMessage<ResourceLoadedMessage>(
    Thread.Game,
    {
      type: ResourceMessageType.ResourceLoaded,
      id,
      loaded: resource.loaded,
      error: resource.error,
      response,
    },
    transferList
  );
}

export function registerResourceLoader(
  ctx: RenderThreadState,
  resourceType: string,
  resourceLoader: ResourceLoader<any, any, any>
) {
  const resourceModule = getModule(ctx, ResourceModule);
  resourceModule.resourceLoaders.set(resourceType, resourceLoader);

  return () => {
    resourceModule.resourceLoaders.delete(resourceType);
  };
}

export function waitForLocalResource<Resource>(ctx: RenderThreadState, resourceId: ResourceId): Promise<Resource> {
  const resourceModule = getModule(ctx, ResourceModule);
  const deferred = resourceModule.deferredResources.get(resourceId);

  if (deferred) {
    return deferred.promise as Promise<Resource>;
  }

  return Promise.reject(new Error(`Resource ${resourceId} not found.`));
}
