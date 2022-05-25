import { getModule } from "../module/module.common";
import { RendererModule } from "../renderer/renderer.render";
import { RenderThreadState } from "../RenderWorker";
import {
  AddResourceRefMessage,
  LoadResourceMessage,
  RemoveResourceRefMessage,
  PostMessageTarget,
  WorkerMessageType,
} from "../WorkerMessage";

export interface ResourceManager {
  buffer: SharedArrayBuffer;
  view: Uint32Array;
  store: Map<number, ResourceInfo<any, any>>;
  resourceLoaders: Map<string, ResourceLoader<any, any, any>>;
  workerMessageTarget: PostMessageTarget;
}

export type ResourceLoaderFactory<Def extends ResourceDefinition, Resource, RemoteResource = undefined> = (
  manager: ResourceManager
) => ResourceLoader<Def, Resource, RemoteResource>;

export interface ResourceLoader<Def extends ResourceDefinition, Resource, RemoteResource = undefined> {
  type: string;
  load(resourceDef: Def): Promise<ResourceLoaderResponse<Resource, RemoteResource>>;
  addRef?(resourceId: number): void;
  removeRef?(resourceId: number): void;
  dispose?(resourceId: number): void;
}

export interface ResourceLoaderResponse<Resource, RemoteResource = undefined> {
  name?: string;
  resource: Resource;
  remoteResource?: RemoteResource;
  transferList?: (Transferable | OffscreenCanvas)[];
}

export interface ResourceInfo<Resource, RemoteResource = undefined> {
  resourceId: number;
  type: string;
  name: string;
  refCount: number;
  state: ResourceState;
  resource?: Resource;
  promise: Promise<ResourceLoaderResponse<Resource, RemoteResource>>;
  error?: Error;
}

export enum ResourceState {
  Loading = "loading",
  Loaded = "loaded",
  Error = "error",
}

export interface ResourceDefinition {
  type: string;
  name?: string;
}

export function createResourceManagerBuffer() {
  return new SharedArrayBuffer(4);
}

export function createResourceManager(
  buffer: SharedArrayBuffer,
  workerMessageTarget: PostMessageTarget
): ResourceManager {
  return {
    buffer,
    view: new Uint32Array(buffer),
    store: new Map(),
    resourceLoaders: new Map(),
    workerMessageTarget,
  };
}

export function registerResourceLoader(
  manager: ResourceManager,
  loaderFactory: ResourceLoaderFactory<any, any, any>
): void {
  const loader = loaderFactory(manager);
  manager.resourceLoaders.set(loader.type, loader);
}

export function onLoadResource<Def extends ResourceDefinition, Resource, RemoteResource = undefined>(
  state: RenderThreadState,
  { resourceDef, resourceId }: LoadResourceMessage<Def>
): void {
  const manager = getModule(state, RendererModule).resourceManager;
  const { type } = resourceDef;
  const loader: ResourceLoader<Def, Resource, RemoteResource> = manager.resourceLoaders.get(type)!;

  if (!loader) {
    throw new Error(`Resource loader ${type} not registered.`);
  }

  const name = resourceDef.name || `${type}[${resourceId}]`;

  const resourceInfo: ResourceInfo<Resource, RemoteResource> = {
    resourceId,
    type,
    name,
    refCount: 1,
    state: ResourceState.Loading,
    resource: undefined,
    promise: loader.load({ ...resourceDef, name }),
  };

  manager.store.set(resourceId, resourceInfo);

  resourceInfo.promise
    .then((response) => {
      if (!resourceDef.name && response.name) {
        resourceInfo.name = response.name;
      }

      resourceInfo.resource = response.resource;
      resourceInfo.state = ResourceState.Loaded;

      manager.workerMessageTarget.postMessage(
        {
          type: WorkerMessageType.ResourceLoaded,
          resourceId,
          remoteResource: response.remoteResource,
        },
        response.transferList
      );
    })
    .catch((error) => {
      console.error(error);
      resourceInfo.state = ResourceState.Error;
      resourceInfo.error = error;
      manager.workerMessageTarget.postMessage({
        type: WorkerMessageType.ResourceLoadError,
        resourceId,
        error,
      });
    });
}

export function onAddResourceRef(state: RenderThreadState, { resourceId }: AddResourceRefMessage) {
  const manager = getModule(state, RendererModule).resourceManager;
  const resourceInfo = manager.store.get(resourceId);

  if (!resourceInfo) {
    return;
  }

  const loader = manager.resourceLoaders.get(resourceInfo.type)!;

  if (loader.addRef) {
    loader.addRef(resourceId);
  }

  resourceInfo.refCount++;
}

export function onRemoveResourceRef(state: RenderThreadState, { resourceId }: RemoveResourceRefMessage) {
  const manager = getModule(state, RendererModule).resourceManager;
  const resourceInfo = manager.store.get(resourceId);

  if (!resourceInfo) {
    return;
  }

  const loader = manager.resourceLoaders.get(resourceInfo.type)!;

  if (resourceInfo.refCount === 1) {
    if (loader.dispose) {
      loader.dispose(resourceId);
    }

    manager.store.delete(resourceId);

    manager.workerMessageTarget.postMessage({
      type: WorkerMessageType.ResourceDisposed,
      resourceId,
    });
  } else {
    if (loader.removeRef) {
      loader.removeRef(resourceId);
    }

    resourceInfo.refCount--;
  }
}

export async function loadResource<Resource>(
  manager: ResourceManager,
  resourceId: number
): Promise<Resource | undefined> {
  const resourceInfo = manager.store.get(resourceId);

  if (resourceInfo) {
    const response = await resourceInfo.promise;
    return response.resource;
  }

  return undefined;
}

export function addResource<Resource>(manager: ResourceManager, type: string, resource: Resource, name?: string) {
  const resourceId = Atomics.add(manager.view, 0, 1);

  const _name = name || `${type}[${resourceId}]`;

  const resourceInfo: ResourceInfo<Resource, any> = {
    resourceId,
    type,
    name: _name,
    refCount: 1,
    state: ResourceState.Loaded,
    resource,
    promise: Promise.resolve({ name: _name, resource }),
  };

  manager.store.set(resourceId, resourceInfo);

  return resourceId;
}
