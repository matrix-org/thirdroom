import { WorkerMessageType, PostMessageTarget } from "../WorkerMessage";
import { ResourceDefinition, ResourceState } from "./ResourceManager";

export interface RemoteResourceManager {
  buffer: SharedArrayBuffer;
  view: Uint32Array;
  postMessageTarget: PostMessageTarget;
  store: Map<number, RemoteResourceInfo<any>>;
}

export interface RemoteResourceInfo<RemoteResource = undefined> {
  resourceId: number;
  type: string;
  state: ResourceState;
  error?: any;
  remoteResource?: RemoteResource;
}

export function createRemoteResourceManager(
  buffer: SharedArrayBuffer,
  postMessageTarget: PostMessageTarget
): RemoteResourceManager {
  return {
    buffer,
    view: new Uint32Array(buffer),
    postMessageTarget,
    store: new Map(),
  };
}

export function loadRemoteResource<Def extends ResourceDefinition>(
  manager: RemoteResourceManager,
  resourceDef: Def,
  transferList?: Transferable[]
): number {
  const resourceId = Atomics.add(manager.view, 0, 1);

  manager.store.set(resourceId, {
    resourceId,
    type: resourceDef.type,
    state: ResourceState.Loading,
    remoteResource: undefined,
  });

  manager.postMessageTarget.postMessage(
    {
      type: WorkerMessageType.LoadResource,
      resourceId,
      resourceDef,
    },
    transferList
  );

  return resourceId;
}

export function addRemoteResourceRef(manager: RemoteResourceManager, resourceId: number) {
  manager.postMessageTarget.postMessage({
    type: WorkerMessageType.AddResourceRef,
    resourceId,
  });
}

export function removeRemoteResourceRef(manager: RemoteResourceManager, resourceId: number) {
  manager.postMessageTarget.postMessage({
    type: WorkerMessageType.RemoveResourceRef,
    resourceId,
  });
}

export function remoteResourceLoaded(manager: RemoteResourceManager, resourceId: number, remoteResource: any) {
  const resourceInfo = manager.store.get(resourceId);

  if (!resourceInfo) {
    return;
  }

  resourceInfo.state = ResourceState.Loaded;
  resourceInfo.remoteResource = remoteResource;
}

export function remoteResourceLoadError(manager: RemoteResourceManager, resourceId: number, error: any) {
  const resourceInfo = manager.store.get(resourceId);

  if (!resourceInfo) {
    return;
  }

  resourceInfo.state = ResourceState.Error;
  resourceInfo.error = error;
}

export function remoteResourceDisposed(manager: RemoteResourceManager, resourceId: number) {
  manager.store.delete(resourceId);
}
