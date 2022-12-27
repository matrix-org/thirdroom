import { getReadBufferIndex, TripleBuffer } from "../allocator/TripleBuffer";
import { NOOP } from "../config.common";
import { defineModule, Thread, registerMessageHandler, getModule, BaseThreadContext } from "../module/module.common";
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

export type ResourceId = number;

export const StringResourceType = "string";
export const ArrayBufferResourceType = "arrayBuffer";

export enum ResourceMessageType {
  LoadResources = "load-resources",
  ResourceLoaded = "resource-loaded",
}

export type ResourceProps = SharedArrayBuffer | string | TripleBuffer;

export interface CreateResourceMessage {
  resourceType: string;
  id: number;
  props: ResourceProps;
  statusBuffer: TripleBuffer;
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
  resource?: LocalResourceTypes;
  statusBuffer: TripleBuffer;
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
  resourceIds: ResourceId[];
  resourceInfos: Map<ResourceId, LocalResourceInfo>;
  resourcesByType: Map<string, LocalResourceTypes[]>;
  deferredResources: Map<ResourceId, Deferred<unknown>>;
  resourceLoaders: Map<string, ResourceLoader<ThreadContext>>;
}

export class ResourceDisposedError extends Error {}

export const createLocalResourceModule = <ThreadContext extends BaseThreadContext>(
  resourceDefinitions: ILocalResourceConstructor<ThreadContext>[]
) => {
  const ResourceModule = defineModule<ThreadContext, ResourceModuleState<ThreadContext>>({
    name: "resource",
    create() {
      return {
        resourceIds: [],
        resourceInfos: new Map(),
        resourcesByType: new Map(),
        deferredResources: new Map(),
        resourceLoaders: new Map(),
      };
    },
    init(ctx) {
      return createDisposables([
        ...resourceDefinitions.map((def) => registerResource(ctx, def)),
        registerMessageHandler(ctx, ResourceMessageType.LoadResources, onLoadResources),
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

  async function loadResource(
    ctx: ThreadContext,
    resourceModule: ResourceModuleState<ThreadContext>,
    resourceMessage: CreateResourceMessage
  ) {
    const { id, resourceType, props, statusBuffer } = resourceMessage;

    const resourceInfo: LocalResourceInfo = {
      id,
      loaded: false,
      resourceType,
      statusBuffer,
    };

    resourceModule.resourceIds.push(id);

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

      let resourceArr = resourceModule.resourcesByType.get(resourceType);

      if (!resourceArr) {
        resourceArr = [];
        resourceModule.resourcesByType.set(resourceType, resourceArr);
      }

      resourceArr.push(resource);

      deferred.resolve(resourceInfo.resource);
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

    const manager: ILocalResourceManager = {
      getResource: <T extends LocalResourceTypes>(resourceId: ResourceId) => getLocalResource<T>(ctx, resourceId),
    };

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
      const resource = new LocalResourceClass(manager, resourceId, tripleBuffer as TripleBuffer);
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
    return resourceModule.resourceInfos.get(resourceId)?.resource as Resource | undefined;
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

  function getResourceDisposed(ctx: ThreadContext, resourceId: ResourceId): boolean {
    const resourceModule = getModule(ctx, ResourceModule);
    const resource = resourceModule.resourceInfos.get(resourceId);

    if (!resource) {
      return false;
    }

    const index = getReadBufferIndex(resource.statusBuffer);

    return !!resource.statusBuffer.byteViews[index][0];
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

  function ResourceDisposalSystem(ctx: ThreadContext) {
    const { deferredResources, resourceInfos, resourcesByType, resourceIds } = getModule(ctx, ResourceModule);

    for (let i = resourceIds.length - 1; i >= 0; i--) {
      const resourceId = resourceIds[i];

      if (getResourceDisposed(ctx, resourceId)) {
        const resourceInfo = resourceInfos.get(resourceId);

        if (resourceInfo) {
          const deferredResource = deferredResources.get(resourceId);

          if (deferredResource) {
            deferredResource.reject(new ResourceDisposedError("Resource disposed"));
            deferredResources.delete(resourceId);
          }

          const resource = resourceInfo.resource;

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

          resourceInfos.delete(resourceId);

          resourceIds.splice(i, 1);
        }
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
