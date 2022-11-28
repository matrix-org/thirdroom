import { copyToWriteBuffer, createTripleBuffer } from "../allocator/TripleBuffer";
import { GameState } from "../GameTypes";
import { Thread } from "../module/module.common";
import { defineRemoteResourceClass, IRemoteResourceClass } from "./RemoteResourceClass";
import { ResourceId } from "./resource.common";
import {
  addResourceRef,
  createArrayBufferResource,
  createResource,
  createStringResource,
  disposeResource,
  getRemoteResource,
  setRemoteResource,
} from "./resource.game";
import { InitialResourceProps, IRemoteResourceManager, RemoteResource, ResourceDefinition } from "./ResourceDefinition";

export class GameResourceManager implements IRemoteResourceManager {
  private resourceConstructors = new Map<ResourceDefinition, IRemoteResourceClass<ResourceDefinition>>();
  public resources: RemoteResource<ResourceDefinition>[] = [];

  constructor(private ctx: GameState) {}

  createResource<Def extends ResourceDefinition>(
    resourceDef: Def,
    props: InitialResourceProps<Def>
  ): RemoteResource<Def> {
    let resourceConstructor = this.resourceConstructors.get(resourceDef) as IRemoteResourceClass<Def> | undefined;

    if (!resourceConstructor) {
      resourceConstructor = defineRemoteResourceClass<Def>(resourceDef);
      this.resourceConstructors.set(
        resourceDef,
        resourceConstructor as unknown as IRemoteResourceClass<ResourceDefinition>
      );
    }

    const buffer = new ArrayBuffer(resourceDef.byteLength);
    const tripleBuffer = createTripleBuffer(this.ctx.gameToRenderTripleBufferFlags, resourceDef.byteLength);
    const resource = new resourceConstructor(this, buffer, 0, tripleBuffer, props);
    const resourceId = createResource(this.ctx, Thread.Shared, resourceDef.name, tripleBuffer);
    resource.resourceId = resourceId;
    setRemoteResource(this.ctx, resourceId, resource);
    this.resources.push(resource as unknown as RemoteResource<ResourceDefinition>);

    return resource;
  }

  getResource<Def extends ResourceDefinition>(
    resourceDef: Def,
    resourceId: ResourceId
  ): RemoteResource<Def> | undefined {
    return getRemoteResource<RemoteResource<Def>>(this.ctx, resourceId);
  }

  disposeResource(resourceId: number): void {
    const resource = getRemoteResource<RemoteResource<ResourceDefinition>>(this.ctx, resourceId);

    if (!resource) {
      return;
    }

    const index = this.resources.findIndex((resource) => resource.resourceId === resourceId);

    if (index !== -1) {
      this.resources.splice(index, 1);
    }

    const schema = resource.constructor.resourceDef.schema;

    for (const propName in schema) {
      const prop = schema[propName];

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
  }

  getString(store: Uint32Array): string {
    return getRemoteResource<string>(this.ctx, store[0])!;
  }

  setString(value: string, store: Uint32Array): void {
    if (store[0]) {
      disposeResource(this.ctx, store[0]);
    }

    const resourceId = createStringResource(this.ctx, value);
    addResourceRef(this.ctx, resourceId);
    store[0] = resourceId;
  }

  getArrayBuffer(store: Uint32Array): SharedArrayBuffer {
    if (!store[1]) {
      throw new Error("arrayBuffer field not initialized.");
    }

    return getRemoteResource<SharedArrayBuffer>(this.ctx, store[1])!;
  }

  setArrayBuffer(value: SharedArrayBuffer, store: Uint32Array): void {
    if (store[1]) {
      throw new Error("You cannot mutate an existing arrayBuffer field.");
    }

    const resourceId = createArrayBufferResource(this.ctx, value);
    addResourceRef(this.ctx, resourceId);
    store[0] = value.byteLength;
    store[1] = resourceId;
  }

  getRef<Def extends ResourceDefinition>(resourceDef: Def, store: Uint32Array): RemoteResource<Def> | undefined {
    return getRemoteResource<RemoteResource<Def>>(this.ctx, store[0]);
  }

  setRef(value: RemoteResource<ResourceDefinition> | undefined, store: Uint32Array): void {
    if (store[0]) {
      disposeResource(this.ctx, store[0]);
    }

    if (value) {
      store[0] = value.resourceId;
      addResourceRef(this.ctx, store[0]);
    } else {
      store[0] = 0;
    }
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
