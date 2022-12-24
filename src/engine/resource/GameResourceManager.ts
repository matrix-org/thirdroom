import { copyToWriteBuffer, createTripleBuffer } from "../allocator/TripleBuffer";
import { GameState } from "../GameTypes";
import { Thread } from "../module/module.common";
import {
  addResourceRef,
  createArrayBufferResource,
  createResource,
  createStringResource,
  disposeResource,
  getRemoteResource,
  setRemoteResource,
} from "./resource.game";
import { IRemoteResourceManager, RemoteResource, ResourceDefinition, ResourceData } from "./ResourceDefinition";

export class GameResourceManager implements IRemoteResourceManager {
  public resources: RemoteResource<ResourceDefinition>[] = [];

  constructor(private ctx: GameState) {}

  allocateResource(resourceDef: ResourceDefinition): ResourceData {
    const buffer = new ArrayBuffer(resourceDef.byteLength);
    const tripleBuffer = createTripleBuffer(this.ctx.gameToRenderTripleBufferFlags, resourceDef.byteLength);

    return {
      ptr: 0,
      buffer,
      tripleBuffer,
    };
  }

  createResource(resource: RemoteResource<ResourceDefinition>): number {
    const resourceId = createResource(
      this.ctx,
      Thread.Shared,
      resource.constructor.resourceDef.name,
      resource.tripleBuffer,
      { name: resource.name }
    );
    setRemoteResource(this.ctx, resourceId, resource);
    this.resources.push(resource);
    return resourceId;
  }

  disposeResource(resourceId: number): boolean {
    const index = this.resources.findIndex((resource) => resource.resourceId === resourceId);

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

  getRef<T extends ResourceDefinition>(store: Uint32Array): RemoteResource<T> | undefined {
    const resourceId = store[0];
    return resourceId ? getRemoteResource<RemoteResource<T>>(this.ctx, resourceId) : undefined;
  }

  setRef(value: RemoteResource<ResourceDefinition> | undefined, store: Uint32Array, backRef: boolean): void {
    const curResourceId = store[0];
    const nextResourceId = value?.resourceId || 0;

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

  setRefArrayItem<T extends ResourceDefinition>(
    index: number,
    value: RemoteResource<T> | undefined,
    store: Uint32Array
  ): void {
    const curResourceId = store[index];
    const nextResourceId = value?.resourceId || 0;

    if (nextResourceId && nextResourceId !== curResourceId) {
      this.addRef(nextResourceId);
    }

    if (curResourceId && nextResourceId !== curResourceId) {
      this.removeRef(curResourceId);
    }

    store[index] = nextResourceId;
  }

  getRefArrayItem<T extends ResourceDefinition>(index: number, store: Uint32Array): RemoteResource<T> | undefined {
    const resourceId = store[index];
    return resourceId ? getRemoteResource<RemoteResource<T>>(this.ctx, resourceId) : undefined;
  }

  addRef(resourceId: number) {
    addResourceRef(this.ctx, resourceId);
  }

  removeRef(resourceId: number) {
    disposeResource(this.ctx, resourceId);
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
