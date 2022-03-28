import { RemoteResourceMessage } from "./RemoteResourceManager";

export interface IPostMessageTarget {
  postMessage(message: any, transfer?: Transferable[]): void;
}

export interface ResourceManager {
  buffer: SharedArrayBuffer;
  view: Uint32Array;
  store: Map<number, ResourceInfo<any, any>>;
  resourceLoaders: Map<string, ResourceLoader<any, any, any>>;
  postMessageTarget: IPostMessageTarget;
}

export type ResourceLoaderFactory<
  Def extends ResourceDefinition,
  Resource,
  RemoteResource = undefined
> = (manager: ResourceManager) => ResourceLoader<Def, Resource, RemoteResource>;

export interface ResourceLoader<
  Def extends ResourceDefinition,
  Resource,
  RemoteResource = undefined
> {
  type: string;
  load(
    resourceDef: Def
  ): Promise<ResourceLoaderResponse<Resource, RemoteResource>>;
  addRef?(resourceId: number): void;
  removeRef?(resourceId: number): void;
  dispose?(resourceId: number): void;
}

export interface ResourceLoaderResponse<Resource, RemoteResource = undefined> {
  name?: string;
  resource: Resource;
  remoteResource?: RemoteResource;
  transferList?: Transferable[];
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

export interface IResourceMessage {
  command: ResourceManagerCommand;
}

export type ResourceMessage =
  | LoadedResourceMessage<any>
  | LoadErrorResourceMessage<any>
  | DisposedResourceMessage;

export enum ResourceManagerCommand {
  Load = "load",
  Loaded = "loaded",
  LoadError = "load-error",
  AddRef = "add-ref",
  RemoveRef = "remove-ref",
  Disposed = "disposed",
}

export interface LoadedResourceMessage<RemoteResource = undefined>
  extends IResourceMessage {
  command: ResourceManagerCommand.Loaded;
  resourceId: number;
  remoteResource?: RemoteResource;
}

export interface LoadErrorResourceMessage<Error> extends IResourceMessage {
  command: ResourceManagerCommand.LoadError;
  resourceId: number;
  error: Error;
}

export interface DisposedResourceMessage extends IResourceMessage {
  command: ResourceManagerCommand.Disposed;
  resourceId: number;
}

export interface ResourceDefinition {
  type: string;
  name?: string;
  [key: string]: any;
}

export function createResourceManager(
  postMessageTarget: IPostMessageTarget
): ResourceManager {
  const buffer = new SharedArrayBuffer(4);

  return {
    buffer,
    view: new Uint32Array(buffer),
    store: new Map(),
    resourceLoaders: new Map(),
    postMessageTarget,
  };
}

export function registerResourceLoader(
  manager: ResourceManager,
  loaderFactory: ResourceLoaderFactory<any, any, any>
): void {
  const loader = loaderFactory(manager);
  manager.resourceLoaders.set(loader.type, loader);
}

export function processRemoteResourceMessage(
  manager: ResourceManager,
  message: RemoteResourceMessage
) {
  switch (message.command) {
    case ResourceManagerCommand.Load:
      loadResource(manager, message.resourceId, message.resourceDef);
      break;
    case ResourceManagerCommand.AddRef:
      addResourceRef(manager, message.resourceId);
      break;
    case ResourceManagerCommand.RemoveRef:
      removeResourceRef(manager, message.resourceId);
      break;
  }
}

async function loadResource<
  Def extends ResourceDefinition,
  Resource,
  RemoteResource = undefined
>(
  manager: ResourceManager,
  resourceId: number,
  resourceDef: Def
): Promise<ResourceInfo<Resource, RemoteResource>> {
  const { type } = resourceDef;
  const loader: ResourceLoader<Def, Resource, RemoteResource> =
    manager.resourceLoaders.get(type)!;

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

  try {
    const response = await resourceInfo.promise;

    if (!resourceDef.name && response.name) {
      resourceInfo.name = response.name;
    }

    resourceInfo.resource = response.resource;
    resourceInfo.state = ResourceState.Loaded;

    manager.postMessageTarget.postMessage(
      {
        command: ResourceManagerCommand.Loaded,
        resourceId,
        remoteResource: response.remoteResource,
      } as LoadedResourceMessage<RemoteResource>,
      response.transferList
    );
  } catch (error: any) {
    console.error(error);
    resourceInfo.state = ResourceState.Error;
    resourceInfo.error = error;
    manager.postMessageTarget.postMessage({
      command: ResourceManagerCommand.LoadError,
      resourceId,
      error,
    } as LoadErrorResourceMessage<typeof error>);
  }

  return resourceInfo;
}

function addResourceRef(manager: ResourceManager, resourceId: number) {
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

function removeResourceRef(manager: ResourceManager, resourceId: number) {
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

    manager.postMessageTarget.postMessage({
      command: ResourceManagerCommand.Disposed,
      resourceId,
    } as ResourceMessage);
  } else {
    if (loader.removeRef) {
      loader.removeRef(resourceId);
    }

    resourceInfo.refCount--;
  }
}

export async function asyncLoadResource<Resource>(
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
