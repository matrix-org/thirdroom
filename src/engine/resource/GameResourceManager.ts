import { copyToWriteBuffer, createTripleBuffer } from "../allocator/TripleBuffer";
import { GameState } from "../GameTypes";
import { GLTFResource } from "../gltf/gltf.game";
import {
  addResourceRef,
  createArrayBufferResource,
  createRemoteResource,
  createStringResource,
  getRemoteResource,
  removeResourceRef,
} from "./resource.game";
import {
  IRemoteResourceManager,
  RemoteResource,
  ResourceDefinition,
  ResourceData,
  ResourceManagerGLTFCacheEntry,
} from "./ResourceDefinition";

export class GameResourceManager implements IRemoteResourceManager<GameState> {
  public resources: RemoteResource<GameState>[] = [];
  private gltfCache: Map<string, ResourceManagerGLTFCacheEntry> = new Map();

  constructor(private ctx: GameState) {}

  getCachedGLTF(uri: string): Promise<GLTFResource> | undefined {
    const entry = this.gltfCache.get(uri);

    if (!entry) {
      return undefined;
    }

    entry.refCount++;

    return entry.promise;
  }

  cacheGLTF(uri: string, promise: Promise<GLTFResource>): void {
    this.gltfCache.set(uri, {
      promise,
      refCount: 1,
    });
  }

  removeGLTFRef(uri: string): boolean {
    const entry = this.gltfCache.get(uri);

    if (entry && --entry.refCount <= 0) {
      this.gltfCache.delete(uri);
      return true;
    }

    return false;
  }

  allocateResource(resourceDef: ResourceDefinition): ResourceData {
    const buffer = new ArrayBuffer(resourceDef.byteLength);
    const tripleBuffer = createTripleBuffer(this.ctx.gameToRenderTripleBufferFlags, resourceDef.byteLength);

    return {
      ptr: 0,
      buffer,
      tripleBuffer,
    };
  }

  createResource(resource: RemoteResource<GameState>): number {
    const resourceId = createRemoteResource(this.ctx, resource);
    this.resources.push(resource);
    return resourceId;
  }

  removeResourceRefs(resourceId: number): boolean {
    const index = this.resources.findIndex((resource) => resource.eid === resourceId);

    if (index === -1) {
      return false;
    }

    const resource = this.resources[index];

    const schema = resource.constructor.resourceDef.schema;

    for (const propName in schema) {
      const prop = schema[propName];

      if (prop.backRef) {
        continue;
      }

      if (prop.type === "ref" || prop.type === "string" || prop.type === "refArray" || prop.type === "refMap") {
        const resourceIds = resource.__props[propName];

        for (let i = 0; i < resourceIds.length; i++) {
          const resourceId = resourceIds[i];

          if (resourceId) {
            this.removeRef(resourceId);
          }
        }
      } else if (prop.type === "arrayBuffer") {
        const resourceId = resource.__props[propName][1];

        if (resourceId) {
          this.removeRef(resourceId);
        }
      }
    }

    return true;
  }

  getString(store: Uint32Array): string {
    const resourceId = store[0];
    return resourceId ? getRemoteResource<string>(this.ctx, store[0]) || "" : "";
  }

  setString(value: string, store: Uint32Array): void {
    const resourceId = store[0];
    const curValue = resourceId ? getRemoteResource<string>(this.ctx, resourceId) || "" : "";

    if (curValue !== value) {
      if (store[0]) {
        this.removeRef(store[0]);
      }

      if (value) {
        const resourceId = createStringResource(this.ctx, value);
        this.addRef(resourceId);
        store[0] = resourceId;
      }
    }
  }

  getArrayBuffer(store: Uint32Array): SharedArrayBuffer {
    if (!store[1]) {
      throw new Error("arrayBuffer field not initialized.");
    }

    const resourceId = store[1];
    return getRemoteResource<SharedArrayBuffer>(this.ctx, resourceId) as SharedArrayBuffer;
  }

  setArrayBuffer(value: SharedArrayBuffer, store: Uint32Array): void {
    if (store[1]) {
      throw new Error("You cannot mutate an existing arrayBuffer field.");
    }

    const resourceId = createArrayBufferResource(this.ctx, value);
    this.addRef(resourceId);
    store[0] = value.byteLength;
    store[1] = resourceId;
  }

  getRef<T extends RemoteResource<GameState>>(store: Uint32Array): T | undefined {
    const resourceId = store[0];
    return resourceId ? getRemoteResource<T>(this.ctx, resourceId) : undefined;
  }

  setRef(value: RemoteResource<GameState> | undefined, store: Uint32Array, backRef: boolean): void {
    const curResourceId = store[0];
    const nextResourceId = value?.eid || 0;

    if (!backRef) {
      if (nextResourceId && nextResourceId !== curResourceId) {
        this.addRef(nextResourceId);
      }

      if (curResourceId && nextResourceId !== curResourceId) {
        this.removeRef(curResourceId);
      }
    }

    store[0] = nextResourceId;
  }

  setRefArray(value: RemoteResource<GameState>[], store: Uint32Array): void {
    for (let i = 0; i < value.length; i++) {
      this.addRef(value[i].eid);
    }

    for (let i = 0; i < store.length; i++) {
      const resourceId = store[i];

      if (resourceId) {
        this.removeRef(resourceId);
      }

      store[i] = 0;
    }

    for (let i = 0; i < value.length; i++) {
      store[i] = value[i].eid || 0;
    }
  }

  setRefMap(value: { [key: number]: RemoteResource<GameState> }, store: Uint32Array): void {
    for (const key in value) {
      this.addRef(value[key].eid);
    }

    for (let i = 0; i < store.length; i++) {
      const resourceId = store[i];

      if (resourceId) {
        this.removeRef(resourceId);
      }

      store[i] = 0;
    }

    for (const key in value) {
      store[key] = value[key].eid || 0;
    }
  }

  getRefArrayItem<T extends RemoteResource<GameState>>(index: number, store: Uint32Array): T | undefined {
    const resourceId = store[index];
    return resourceId ? getRemoteResource<T>(this.ctx, resourceId) : undefined;
  }

  addRef(resourceId: number) {
    addResourceRef(this.ctx, resourceId);
  }

  removeRef(resourceId: number) {
    removeResourceRef(this.ctx, resourceId);
  }

  commitResources() {
    const resources = this.resources;

    for (let i = 0; i < resources.length; i++) {
      const resource = resources[i];
      const byteView = resource.byteView;

      if (resource.initialized) {
        copyToWriteBuffer(resource.tripleBuffer, byteView);
      } else {
        const tripleBufferByteViews = resource.tripleBuffer.byteViews;
        tripleBufferByteViews[0].set(byteView);
        tripleBufferByteViews[1].set(byteView);
        tripleBufferByteViews[2].set(byteView);
        resource.initialized = true;
      }
    }
  }
}
