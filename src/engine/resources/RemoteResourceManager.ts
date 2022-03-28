import { ResourceDefinition, ResourceManagerCommand, ResourceMessage, ResourceState, IResourceMessage, IPostMessageTarget } from "./ResourceManager";

export type RemoteResourceLoaderFactory<RemoteResource = undefined> = (
  manager: RemoteResourceManager
) => RemoteResourceLoader<RemoteResource>;

export interface RemoteResourceLoader<RemoteResource = undefined> {
  type: string;
  load?(resourceId: number, resourceDef: ResourceDefinition): void;
  loaded?(resourceId: number, remoteResource: RemoteResource): void;
  loadError?(resourceId: number, error: any): void;
  addRef?(resourceId: number): void;
  removeRef?(resourceId: number): void;
  dispose?(resourceId: number): void;
}

export interface RemoteResourceManager {
  buffer: SharedArrayBuffer;
  view: Uint32Array;
  postMessageTarget: IPostMessageTarget;
  store: Map<number, RemoteResourceInfo<any>>;
  resourceLoaders: Map<string, RemoteResourceLoader<any>>
}

export interface RemoteResourceInfo<RemoteResource = undefined> {
  resourceId: number;
  type: string;
  state: ResourceState;
  remoteResource?: RemoteResource;
}

export interface LoadResourceMessage extends IResourceMessage {
  command: ResourceManagerCommand.Load;
  resourceId: number;
  resourceDef: ResourceDefinition;
}

export interface AddResourceRefMessage extends IResourceMessage {
  command: ResourceManagerCommand.AddRef;
  resourceId: number;
}

export interface RemoveResourceRefMessage extends IResourceMessage {
  command: ResourceManagerCommand.RemoveRef;
  resourceId: number;
}

export type RemoteResourceMessage =
| LoadResourceMessage
| AddResourceRefMessage
| RemoveResourceRefMessage;

export function createRemoteResourceManager(buffer: SharedArrayBuffer, postMessageTarget: IPostMessageTarget): RemoteResourceManager {
  return {
    buffer,
    view: new Uint32Array(buffer),
    postMessageTarget,
    store: new Map(),
    resourceLoaders: new Map(),
  };
}

export function registerRemoteResourceLoader(
  manager: RemoteResourceManager,
  loaderFactory: RemoteResourceLoaderFactory<any>
): void {
  const loader = loaderFactory(manager);
  manager.resourceLoaders.set(loader.type, loader);
}

export function loadRemoteResource(
  manager: RemoteResourceManager,
  resourceDef: ResourceDefinition,
  transferList?: Transferable[]
): number {
  const resourceId = Atomics.add(manager.view, 0, 1);

  manager.store.set(resourceId, {
    resourceId,
    type: resourceDef.type,
    state: ResourceState.Loading,
    remoteResource: undefined,
  });

  manager.postMessageTarget.postMessage({
    command: ResourceManagerCommand.Load,
    resourceId,
    resourceDef,
  } as RemoteResourceMessage, transferList);

  return resourceId;
}

export function addRemoteResourceRef(
  manager: RemoteResourceManager,
  resourceId: number
) {
  manager.postMessageTarget.postMessage({
    command: ResourceManagerCommand.AddRef,
    resourceId,
  } as RemoteResourceMessage);
}

export function removeRemoteResourceRef(
  manager: RemoteResourceManager,
  resourceId: number
) {
  manager.postMessageTarget.postMessage({
    command: ResourceManagerCommand.RemoveRef,
    resourceId,
  } as RemoteResourceMessage);
}

export function processResourceMessage(
  manager: RemoteResourceManager,
  message: ResourceMessage,
) {
  switch (message.command) {
    case ResourceManagerCommand.Loaded: {
      remoteResourceLoaded(manager, message.resourceId, message.remoteResource);
      break;
    }
    case ResourceManagerCommand.LoadError: {
      remoteResourceLoadError(manager, message.resourceId, message.error);
      break;
    }
    case ResourceManagerCommand.Disposed: {
      remoteResourceDisposed(manager, message.resourceId);
      break;
    }
  }
}

function remoteResourceLoaded(manager: RemoteResourceManager, resourceId: number, remoteResource: any) {
  const resourceInfo = manager.store.get(resourceId);

  if (!resourceInfo) {
    return;
  }

  resourceInfo.state = ResourceState.Loaded;
  resourceInfo.remoteResource = remoteResource;

  const loader = manager.resourceLoaders.get(resourceInfo.type)!;

  if (loader.loaded) {
    loader.loaded(resourceId, remoteResource);
  }
}

function remoteResourceLoadError(manager: RemoteResourceManager, resourceId: number, error: any) {
  const resourceInfo = manager.store.get(resourceId);

  if (!resourceInfo) {
    return;
  }

  resourceInfo.state = ResourceState.Error;

  const loader = manager.resourceLoaders.get(resourceInfo.type)!;

  if (loader.loadError) {
    loader.loadError(resourceId, error);
  }
}

function remoteResourceDisposed(manager: RemoteResourceManager, resourceId: number) {
  const resourceInfo = manager.store.get(resourceId);

  if (!resourceInfo) {
    return;
  }

  const loader = manager.resourceLoaders.get(resourceInfo.type)!;

  if (loader.dispose) {
    loader.dispose(resourceId);
  }

  manager.store.delete(resourceId);
}